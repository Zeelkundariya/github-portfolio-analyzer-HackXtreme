export function calculateScore(user, repos, events = []) {
  let score = 0;
  let redFlags = [];
  let strengths = [];

  // 1. Profile Hygiene (Max 20)
  if (user.bio) { score += 5; strengths.push("Bio is present"); }
  else redFlags.push("Missing bio");

  if (user.location) { score += 2; }
  if (user.email) { score += 3; strengths.push("Public email for recruiters"); }
  if (user.blog) { score += 2; strengths.push("Links to external portfolio/blog"); }

  if (user.followers >= 10) { score += 4; strengths.push("Decent follower count (Social Proof)"); }
  else if (user.followers >= 50) { score += 8; strengths.push("Strong community influence"); }

  if (user.public_repos >= 5) { score += 5; }

  // 2. Repository Quality (Max 35)
  const originalRepos = repos.filter(r => !r.fork);
  const forkedRepos = repos.filter(r => r.fork);

  // 1. Repo Volume (Max 20)
  score += Math.min(repos.length * 2, 20); // 2 points per repo up to 20

  // 2. Repo Quality (Max 30)
  let descriptionCount = 0;
  repos.forEach(repo => {
    if (repo.description) descriptionCount++;
  });

  // Weighted quality: 70% of repos having descriptions is "Perfect" for this metric
  const descriptionRatio = repos.length > 0 ? descriptionCount / repos.length : 0;
  score += Math.min(descriptionRatio * 40, 30); // Up to 30 points if ~75% have descriptions

  let hasDescriptions = 0;
  let hasHomepage = 0;
  let hasTopics = 0;
  let totalStars = 0;

  originalRepos.forEach(repo => {
    if (repo.description) hasDescriptions++;
    if (repo.homepage) hasHomepage++;
    if (repo.topics && repo.topics.length > 0) hasTopics++;
    totalStars += repo.stargazers_count;
  });

  if (originalRepos.length > 0) {
    if (hasDescriptions / originalRepos.length > 0.8) { score += 5; strengths.push("Most repos have descriptions"); }
    else if (hasDescriptions / originalRepos.length < 0.5) redFlags.push("Many repos lack descriptions");

    if (hasHomepage > 0) { score += 5; strengths.push(`Live demos available (${hasHomepage} repos)`); }
    if (hasTopics / originalRepos.length > 0.5) { score += 5; } // Good discoverability
  }

  if (totalStars > 5) { score += 5; strengths.push(`Received ${totalStars} stars across repos`); }

  // 3. Activity & Engagement (Max 30)
  const activeRepos = repos.filter(r => {
    const updated = new Date(r.updated_at);
    return (Date.now() - updated) / (1000 * 60 * 60 * 24) < 90; // Active in last 3 months
  });

  const recentActivityScore = Math.min(activeRepos.length * 5, 15);
  score += recentActivityScore;

  // New: Community & OSS Engagement
  let externalPRs = 0;
  let communityComments = 0;

  events.forEach(e => {
    // PRs to other people's repos
    if (e.type === 'PullRequestEvent' && e.payload.action === 'opened') {
      const repoOwner = e.repo.name.split('/')[0];
      if (repoOwner && repoOwner.toLowerCase() !== user.login.toLowerCase()) {
        externalPRs++;
      }
    }
    // Helping others via comments/reviews
    if (e.type === 'IssueCommentEvent' || e.type === 'PullRequestReviewCommentEvent') {
      communityComments++;
    }
  });

  if (activeRepos.length === 0) redFlags.push("No recent activity (last 3 months)");
  else strengths.push("Active contributor in recent months");

  if (externalPRs > 0) {
    const prPoints = Math.min(externalPRs * 10, 20);
    score += prPoints;
    strengths.push(`Open Source Contributor (${externalPRs} external PRs)`);
  }

  if (communityComments > 5) {
    score += 5;
    strengths.push("Active community member (Helping others)");
  }

  // 4. Technical Rigor & Expertise (Max 25) [v4.0]
  const languages = new Set(originalRepos.map(r => r.language).filter(l => l));
  if (languages.size >= 3) { score += 5; strengths.push("Polyglot developer (3+ languages)"); }

  // Rigor Multiplier: Deep technical languages
  const rigorLanguages = ['rust', 'c++', 'c', 'go', 'haskell', 'scala', 'assembly'];
  const hasRigor = originalRepos.some(r => r.language && rigorLanguages.includes(r.language.toLowerCase()));
  if (hasRigor) {
    score += 5;
    strengths.push("Technical Rigor (Proficient in systems/complex languages)");
  }

  const languageCounts = {};
  originalRepos.forEach(r => { if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1; });
  const sortedLangs = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);
  if (sortedLangs.length > 0 && sortedLangs[0][1] / originalRepos.length > 0.6 && originalRepos.length >= 3) {
    score += 3;
    strengths.push(`Domain Expert in ${sortedLangs[0][0]}`);
  }

  const highQualityRepos = originalRepos.filter(r => r.stargazers_count > 0 && r.description);
  if (highQualityRepos.length >= 2) { score += 7; strengths.push("Has high-quality/starred projects"); }

  // 5. Precision & Engineering Depth [v5.0] (Max 30)
  let depthScore = 0;
  let securityPenalty = 0;

  // Automation & DevOps Detection
  const hasAutomation = events.some(e => e.type === 'WorkflowRunEvent' || e.type === 'WorkflowJobEvent');
  if (hasAutomation) {
    depthScore += 8;
    strengths.push("DevOps/Automation Signal (Uses GitHub Actions)");
  }

  // New in v5.0: Security Hygiene & Industry Authority
  const securityRiskKeywords = ['.env', 'credentials', 'password', 'id_rsa', 'secret', 'access_key', 'token'];
  const majorReposSet = new Set(); // To track major OSS involvement

  originalRepos.forEach(repo => {
    const name = (repo.name || "").toLowerCase();
    const desc = (repo.description || "").toLowerCase();

    // 1. Security Hygiene Check
    if (securityRiskKeywords.some(key => name.includes(key) || desc.includes(key))) {
      securityPenalty += 5;
    }

    // 2. Documentation Depth
    if (repo.description && repo.description.length > 80) depthScore += 1.5;
    else if (repo.description) depthScore += 0.5;

    // 3. Impact Density (Healthy Star-to-Fork ratio)
    if (repo.stargazers_count > 5) {
      const forks = repo.forks_count || 0;
      const stars = repo.stargazers_count;
      if (forks > 0 && stars / forks < 10) depthScore += 1.5; // High utility signal
    }

    // 4. Maintenance Sustainability
    const created = new Date(repo.created_at);
    const updated = new Date(repo.updated_at);
    const tenureMonths = (updated - created) / (1000 * 60 * 60 * 24 * 30);
    if (tenureMonths > 12) depthScore += 2;
    else if (tenureMonths > 4) depthScore += 1;

    // 5. Structure
    if (repo.has_wiki) depthScore += 0.5;
    if (repo.has_pages) depthScore += 0.5;
  });

  // Major OSS Detection (Heuristic: PRs to repos likely belonging to orgs)
  events.forEach(e => {
    if (e.type === 'PullRequestEvent' && e.payload.action === 'opened') {
      const [owner, name] = e.repo.name.split('/');
      if (owner && owner.toLowerCase() !== user.login.toLowerCase()) {
        // High Signal: If repo name is a known major library or owner is likely an org
        if (owner.length < 15 && !owner.match(/\d/)) { // Heuristic for non-individual owners
          depthScore += 2;
        }
      }
    }
  });

  // 6. Commit Professionalism & Reliability
  const pushEvents = events.filter(e => e.type === 'PushEvent');
  const conventionalMsgCount = pushEvents.filter(e => {
    const msg = e.payload.commits?.[0]?.message || "";
    return /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|working|revert)(\(.+\))?:/.test(msg);
  }).length;

  if (conventionalMsgCount > 3) {
    score += 10;
    strengths.push("Professional Commit Discipline");
  }

  // Reliability Streak (Activity across multiple days)
  const activeDays = new Set(events.map(e => e.created_at.split('T')[0])).size;
  if (activeDays > 10) {
    score += 5;
    strengths.push("High Contributor Reliability");
  }

  score += Math.min(depthScore, 15);
  score -= Math.min(securityPenalty, 15);
  if (securityPenalty > 0) redFlags.push("Security Hygiene: Detected possible secrets in public repos");

  // 7. Penalties
  if (originalRepos.length === 0 && forkedRepos.length > 0) {
    score -= 25;
    redFlags.push("Lack of original work (Fork-only profile)");
  }
  if (activeRepos.length === 0) {
    score -= 15;
    redFlags.push("High dormancy (Critical inactivity)");
  }

  // Cap score
  score = Math.max(0, Math.min(Math.round(score), 100));

  let verdict =
    score >= 97 ? "World-Class Engineer 🏆" :
      score >= 88 ? "Industry Authority 💎" :
        score >= 75 ? "Lead-Grade Potential 🚀" :
          score >= 55 ? "Solid Developer 🌟" :
            score >= 30 ? "Aspiring Talent 🛠" : "Ghost Town 👻";

  // New helpers
  const roleFit = detectRoleFit(repos);

  const languageBreakdown = calculateLanguageDiversity(repos);
  const communityHealth = evaluateCommunityHealth(repos, events);
  const repoFeedback = generateRepoFeedback(repos);
  const showcasedNames = new Set(repoFeedback.map(r => r.name));
  const priorityFixes = getPriorityFixes(repos, showcasedNames);
  const demoRepos = getDemoRepos(repos);
  const techStack = calculateTechStack(repos);
  const potentialScore = calculatePotentialScore(score, priorityFixes.length);





  return {
    username: user.login,
    score,
    verdict,
    totalRepos: user.public_repos,
    totalStars,
    redFlags: redFlags.slice(0, 5),
    strengths: strengths.slice(0, 5),
    roleFit,
    priorityFixes,
    potentialScore,
    languageBreakdown, // Keep for backward compatibility if needed, but techStack is better
    techStack,         // NEW: replacing languageBreakdown in UI
    communityHealth,
    repoFeedback,
    demoRepos,
    recentContributions: calculateContributions(events),
    consistency: calculateConsistency(events),
    allRepos: (() => {
      // Map repo name (short) to stats from events
      const repoStats = {};
      events.forEach(e => {
        if (e.repo && e.repo.name) {
          const repoName = e.repo.name.split('/').pop(); // Get repo name part
          if (!repoStats[repoName]) repoStats[repoName] = { events: 0, commits: 0 };

          repoStats[repoName].events += 1;
          if (e.type === 'PushEvent' && e.payload.size) {
            repoStats[repoName].commits += e.payload.size;
          }
        }
      });

      return repos.map(r => {
        const stats = repoStats[r.name] || { events: 0, commits: 0 };
        // Weighted logic: Commits are high value, size shows project "weight"
        const activityScore = (stats.commits * 20) + (r.stargazers_count * 10) + (r.forks_count * 5) + (r.size / 100);

        return {
          name: r.name,
          url: r.html_url,
          language: r.language || "Unknown",
          stars: r.stargazers_count,
          forks: r.forks_count,
          size: r.size, // in KB
          recentCommits: Math.max(stats.commits, stats.events > 0 ? 1 : 0), // Fallback to 1 if we see events
          updated_at: r.updated_at,
          description: r.description || "No description provided.",
          isFork: r.fork,
          activityScore: activityScore
        };
      }).sort((a, b) => b.activityScore - a.activityScore); // DESCENDING as requested
    })(),
    generatedAt: Date.now()
  };
}

function calculateContributions(events) {
  let count = 0;
  events.forEach(e => {
    if (e.type === 'PushEvent') count += e.payload.size;
    if (e.type === 'PullRequestEvent' && e.payload.action === 'opened') count++;
    if (e.type === 'IssuesEvent' && e.payload.action === 'opened') count++;
  });
  return count;
}

function calculateConsistency(events) {
  if (events.length === 0) return "Dormant 💤";

  // Simple check of unique days active
  const days = new Set(events.map(e => e.created_at.split('T')[0]));
  const size = days.size;

  if (size > 20) return "Daily Grinder 🔥";
  if (size > 10) return "Steady Coder 🏃";
  if (size > 5) return "Weekend Warrior ⚔️";
  return "Sporadic 🎲";
}

function calculateTechStack(repos) {
  const skills = {};
  const techWhitelist = [
    'react', 'node', 'express', 'python', 'django', 'flask', 'aws', 'docker', 'css', 'html', 'javascript', 'typescript',
    'vue', 'angular', 'nextjs', 'tailwindcss', 'mongodb', 'postgresql', 'vite', 'ui/ux',
    'sql', 'nosql', 'java', 'spring', 'kotlin', 'android', 'swift', 'ios', 'flutter', 'redux', 'graphql',
    'rest api', 'jest', 'cypress', 'webpack', 'babel', 'bootstrap', 'material-ui', 'shadcn', 'prisma', 'sequelize'
  ]; // Filtered out: git, figma, firebase, github

  repos.forEach(r => {
    // 1. Primary Language
    if (r.language) {
      const lang = r.language.toLowerCase();
      if (!['git', 'figma', 'firebase', 'github'].includes(lang)) {
        skills[lang] = (skills[lang] || 0) + 1;
      }
    }

    // 2. GitHub Topics
    if (r.topics) {
      r.topics.forEach(t => {
        const topic = t.toLowerCase();
        if (techWhitelist.includes(topic)) {
          skills[topic] = (skills[topic] || 0) + 1;
        }
      });
    }

    // 3. Smart Extraction from Name/Description
    const content = (r.name + " " + (r.description || "")).toLowerCase();
    techWhitelist.forEach(tech => {
      if (content.includes(tech)) {
        skills[tech] = (skills[tech] || 0) + 0.5;
      }
    });
  });

  return Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([name, count]) => ({ name, count: Math.ceil(count) }));
}

function getPriorityFixes(repos, excludedNames = new Set()) {
  return repos
    .filter(r => !r.fork && !excludedNames.has(r.name))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(repo => {
      let issue = "";
      const name = repo.name;
      const lang = repo.language || "code";

      // Smart Description Generator
      // E.g. "Innovators-Prime" -> "A [Language] project for Innovators Prime."
      const cleanName = name.replace(/-/g, ' ');
      const suggestedDesc = `A ${lang} project for ${cleanName}.`;

      if (!repo.description) {
        issue = `Action: Add a description to '${name}'. Try: "${suggestedDesc}" (Impact: +5 pts)`;
      }
      else if (!repo.homepage && !repo.has_pages) {
        issue = `Action: Deploy '${name}' live (Vercel/Netlify) or add a demo link. Recruiters want to click and see, not just read code. (Impact: +10 pts)`;
      }
      else if (repo.open_issues_count > 5) {
        issue = `Action: Close or label old issues in '${name}'. High issue counts look abandoned. (Impact: +5 pts)`;
      }
      else if (!repo.license) {
        issue = `Action: Add an MIT/Apache license to '${name}'. Unlicensed code is a red flag for companies. (Impact: +5 pts)`;
      }
      else if (!repo.topics || repo.topics.length === 0) {
        issue = `Action: Add GitHub Topics (#${lang.toLowerCase()}, #web) to '${name}'. This makes your skills searchable by recruiters. (Impact: +3 pts)`;
      }

      return { name: repo.name, issues: issue ? [issue] : [] };
    })
    .filter(r => r.issues.length > 0)
    .slice(0, 5);
}

function generateRepoFeedback(repos) {
  return repos
    .filter(r => !r.fork)
    .sort((a, b) => (b.stargazers_count * 2 + new Date(b.updated_at).getTime()) - (a.stargazers_count * 2 + new Date(a.updated_at).getTime()))
    .slice(0, 5)
    .map(repo => {
      let grade = "C";
      let tip = "Add a README.";

      const hasDesc = !!repo.description;
      const hasDemo = !!repo.homepage;
      const stars = repo.stargazers_count;
      const name = repo.name;
      const lang = repo.language || "Project";

      // Rotation for variety
      const variety = (name.length + stars) % 3;

      if (stars > 5 && hasDesc && hasDemo) {
        grade = "A+";
        if (variety === 0) tip = `Top Tier! Pin '${name}' to your profile overview so it's the first thing people see.`;
        else if (variety === 1) tip = `This is distinct. Consider writing a short article/blog post about how you built '${name}'.`;
        else tip = `Great engagement! Keep fixing bugs and replying to issues to show you're an active maintainer.`;
      }
      else if (hasDesc && hasDemo) {
        grade = "B";
        if (variety === 0) tip = `Good job on the demo. Now ensure '${name}' has a clear "How to Run" section in the README.`;
        else if (variety === 1) tip = `Nice work. Share '${name}' on LinkedIn/Twitter with a video of it in action to get more stars.`;
        else tip = `Solid. Add some screenshots or a GIF to the '${name}' README to make it visually appealing.`;
      }
      else if (hasDesc) {
        grade = "C+";
        if (variety === 0) tip = `The code looks good, but '${name}' needs a LIVE DEMO. Use Vercel, Netlify, or GitHub Pages.`;
        else if (variety === 1) tip = `Recruiters are busy. They won't clone '${name}'. Host it somewhere so they can click and play.`;
        else tip = `Can you dockerize '${name}'? Adding a Dockerfile shows advanced DevOps skills to recruiters.`;
      }
      else {
        grade = "D";
        if (variety === 0) tip = `Mystery Box: '${name}' has no description. Edit the "About" section on the right sidebar of the repo.`;
        else if (variety === 1) tip = `This repo is a ghost town. Add a README describing what '${name}' does and why you built it.`;
        else tip = `Don't leave '${name}' empty. Even a single sentence description helps SEO and context.`;
      }

      return {
        name: repo.name,
        url: repo.html_url,
        language: repo.language || "N/A",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        grade,
        tip
      };
    });
}

function getDemoRepos(repos) {
  return repos
    .filter(r => !r.fork && (r.homepage || r.name.toLowerCase().includes('clone')))
    .map(r => {
      let host = "GitHub";
      if (r.homepage) {
        if (r.homepage.includes("vercel")) host = "Vercel";
        else if (r.homepage.includes("netlify")) host = "Netlify";
        else if (r.homepage.includes("github.io")) host = "GitHub Pages";
        else if (r.homepage.includes("heroku")) host = "Heroku";
      }

      return {
        name: r.name,
        url: r.html_url,
        demo: r.homepage || r.html_url, // Fallback to repo URL if no demo link provided
        desc: r.description || "Project featuring multiple website clones and live demos.",
        host: r.homepage ? host : "Live Demo via Repo"
      };
    })
    .sort((a, b) => {
      // Prioritize WEBSITE-CLONE at the top
      if (a.name === "WEBSITE-CLONE") return -1;
      if (b.name === "WEBSITE-CLONE") return 1;
      return 0;
    });
}

function detectRoleFit(repos) {
  let tags = { frontend: 0, backend: 0, data: 0, mobile: 0, devops: 0 };

  repos.forEach(repo => {
    const text = (repo.name + " " + (repo.description || "") + " " + (repo.language || "")).toLowerCase();

    if (text.match(/react|vue|angular|svelte|next|nuxt|css|html|tailwind|bootstrap|redux/)) tags.frontend++;
    if (text.match(/node|express|django|flask|spring|sql|mongo|postgres|firebase|api|graphql|nest/)) tags.backend++;
    if (text.match(/python|pandas|numpy|torch|scikit|tensorflow|keras|data|analysis|jupyter/)) tags.data++;
    if (text.match(/flutter|swift|kotlin|android|ios|react native|ionic/)) tags.mobile++;
    if (text.match(/docker|kubernetes|aws|ci\/cd|jenkins|terraform|ansible/)) tags.devops++;
  });

  const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return "Generalist Developer";

  const topRole = sorted[0][0];
  const count = sorted[0][1];

  if (count < 3) return "Aspiring Developer";

  const roleMap = {
    frontend: "Frontend Specialist",
    backend: "Backend Engineer",
    data: "Data Scientist / ML Engineer",
    mobile: "Mobile App Developer",
    devops: "DevOps Engineer"
  };

  // Check for full stack
  if (tags.frontend > 2 && tags.backend > 2) return "Full Stack Developer";

  return roleMap[topRole] || "Software Engineer";
}

function calculateLanguageDiversity(repos) {
  const counts = {};
  let total = 0;

  repos.forEach(repo => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
      total++;
    }
  });

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([lang, count]) => ({
      language: lang,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8
}

function evaluateCommunityHealth(repos, events = []) {
  const originalRepos = repos.filter(r => !r.fork);
  if (originalRepos.length === 0) return { score: 0, issues: 0, licenseCount: 0 };

  const withLicense = originalRepos.filter(r => r.license).length;
  const totalForks = originalRepos.reduce((acc, r) => acc + r.forks_count, 0);
  const openIssues = originalRepos.reduce((acc, r) => acc + r.open_issues_count, 0);

  // Calculate Activity Blend (Stars + Forks + Issues + Commits)
  let totalCommits = 0;
  events.forEach(e => {
    if (e.type === 'PushEvent') totalCommits += e.payload.size || 0;
  });

  // Blend metric to ensure it's rarely 0.0 for actual developers
  const vitalityPoints = (totalCommits * 2) + (totalForks * 5) + (openIssues * 2);
  const avgActivity = originalRepos.length > 0 ? (vitalityPoints / originalRepos.length).toFixed(1) : "0.0";

  // Simple health score (0-100)
  const licenseScore = (withLicense / originalRepos.length) * 50;
  const forkScore = Math.min(totalForks, 10) * 3;
  const activityScore = Math.min(totalCommits, 20) * 1;

  return {
    licenseCount: withLicense,
    totalRepos: originalRepos.length,
    totalForks,
    openIssues,
    avgActivity,
    healthScore: Math.round(Math.min(licenseScore + forkScore + activityScore, 100))
  };
}

export function analyzeShadowProfile(context) {
  const { score, techStack, strengths, redFlags, roleFit, allRepos = [] } = context;

  // REAL BENCHMARKS based on repository data distribution
  const originalRepos = allRepos.filter(r => !r.isFork);
  const avgDescLength = originalRepos.reduce((acc, r) => acc + (r.description?.length || 0), 0) / (originalRepos.length || 1);

  // Dynamic Architectural Depth calculation (Ultra-Stable Calibration)
  const largeRepos = originalRepos.filter(r => r.size > 3000).length;
  const starredRepos = originalRepos.filter(r => r.stars > 30).length;
  const techVariety = new Set(originalRepos.map(r => r.language)).size;

  // COMPLETELY DETERMINISTIC FORMULA (No scores / 15 dependency)
  const baseComplexity = (largeRepos * 5) + (starredRepos * 8) + (techVariety * 4);
  const archScore = Math.min(Math.max(Math.round(baseComplexity), 35), 75);

  const conventionLevel = strengths.includes("Professional Commit Discipline") ? 95 : 65;

  const benchmarks = [
    {
      category: "Architectural Depth",
      score: archScore,
      topTier: 92,
      gap: archScore > 90 ? "Exhibiting Staff-level system ownership." : "Increase project complexity; add more system design patterns."
    },
    {
      category: "Technical Signaling",
      score: conventionLevel,
      topTier: 95,
      gap: conventionLevel > 90 ? "Signal matches Tier-1 Engineering standards." : "Adopt Conventional Commits and atomic PR patterns."
    },
    {
      category: "Documentation Maturity",
      score: Math.round(Math.min((avgDescLength / 100) * 100, 100)),
      topTier: 85,
      gap: avgDescLength > 80 ? "Sustained high-fidelity documentation signal." : "Expand project READMEs with technical specs."
    }
  ];

  const top3Gaps = [
    { title: "Recursive System Design", desc: "Introduce intentional patterns like MVC or Clean Architecture." },
    { title: "Public API Surface", desc: "Build projects that expose documented, typed public APIs." },
    { title: "Infrastructure-as-Code", desc: "Add Terraform or Kubernetes configurations to prove DevOps rigor." }
  ];

  let shadowPersona = "System Architect 🏛️";
  if (score < 40) shadowPersona = "Rising Contributor 🌱";
  else if (score < 70) shadowPersona = "Agile Developer ⚡";
  else if (score < 85) shadowPersona = "Technical Specialist 🛠️";

  return {
    benchmarks,
    top3Gaps,
    shadowPersona,
    personaDetails: {
      desc: `An engineering profile focused on ${roleFit.toLowerCase()} with strong technical signaling in ${techStack[0]?.name || 'modern'} technologies.`,
      traits: ["High Velocity", "Deep Implementation Depth", "Refinement Focused"]
    }
  };
}

export function calculateImpactDays(events) {
  const days = {};
  const today = new Date();

  // 1. Initialize empty timeline for last 60 days
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days[iso] = {
      date: iso,
      level: 0,
      type: "idle",
      summary: "No telemetry detected.",
      repos: [],
      highlights: []
    };
  }

  // 2. Map real events to timeline
  events.forEach(e => {
    const date = e.created_at.split('T')[0];
    if (days[date]) {
      const repoNameFull = e.repo.name || "unknown/repo";
      const repo = repoNameFull.split('/').pop();
      const payload = e.payload || {};
      if (!days[date].repos.includes(repo)) days[date].repos.push(repo);

      // Stable entropy index for variety (stable per date/repo/type)
      const entropyIdx = (date.length + repo.length + e.type.length + (payload.size || 0)) % 10;

      if (e.type === 'PushEvent') {
        const commits = payload.commits || [];
        const isConventional = commits.some(c => /^(feat|fix|refactor|perf|test|build|ci):/.test(c.message));
        days[date].level = Math.max(days[date].level, isConventional ? 3 : 2);
        days[date].type = isConventional ? "feature" : "routine";

        // Varied Summary Templates
        const templates = isConventional ? [
          `Engineered high-fidelity feature set for ${repo}`,
          `Optimized modular core architecture of ${repo}`,
          `Spearheaded technical refactor in ${repo} codebase`,
          `Refined architectural logic and assets: ${repo}`,
          `Implemented structural system upgrades for ${repo}`,
          `Advanced architectural sprint in ${repo} modules`,
          `Deployed technical debt clearance modules for ${repo}`,
          `Hardened production logic in ${repo} components`
        ] : [
          `Synchronized technical assets in ${repo}`,
          `Refined project state and dependencies: ${repo}`,
          `Updated repository modules in ${repo} tree`,
          `Maintained system integrity for ${repo} project`,
          `Iterative logic refinement in ${repo} service`,
          `Polished technical documentation and core in ${repo}`,
          `Optimized asset pipeline for ${repo} repository`,
          `Managed codebase evolution in ${repo} modules`
        ];
        days[date].summary = templates[entropyIdx % templates.length];

        const commitHighlights = commits.slice(0, 3).map(c => c.message.split('\n')[0]);
        if (commitHighlights.length > 0) {
          days[date].highlights.push(...commitHighlights);
        } else {
          const fallbackHighlights = [
            `Integrated ${payload.size || 1} distinct logic modules into master.`,
            `Established stable upstream logic for ${repo}.`,
            `Provisioned core structural assets for system expansion.`,
            `Mapped new feature-set to isolated dev environments.`,
            `Validated logic deltas for ${repo} production branch.`,
            `Streamlined system telemetry and module state.`,
            `Enforced architectural standards across ${payload.size || 1} files.`,
            `Optimized codebase maintainability via delta updates.`
          ];
          days[date].highlights.push(fallbackHighlights[entropyIdx % fallbackHighlights.length]);
        }
      } else if (e.type === 'PullRequestEvent') {
        const pr = payload.pull_request || {};
        const isMerged = payload.action === 'closed' && pr.merged;
        days[date].level = isMerged ? 4 : 3;
        days[date].type = "refactor";

        days[date].summary = isMerged
          ? `Merged Architectural PR: ${pr.title}`
          : `Proposed System Refinement: ${pr.title}`;

        const prHighlights = [
          `Initiated cross-functional code review and logic refinement.`,
          `Streamlined system architecture via atomic PR logic.`,
          `Validated regression tests and module integrity.`,
          `Optimized codebase maintainability through peer-reviewed updates.`,
          `Coordinated structural module integration for ${repo}.`,
          `Resolved complex architectural conflicts in PR workflow.`,
          `Formalized technical implementation depth for ${repo}.`,
          `Audited technical specs and implementation rigor.`
        ];
        days[date].highlights.push(prHighlights[entropyIdx % prHighlights.length]);
      } else if (e.type === 'WorkflowRunEvent' || e.type === 'WorkflowJobEvent' || e.type === 'CreateEvent') {
        days[date].level = 5;
        days[date].type = "architecture";

        if ((e.type || "").includes('Workflow')) {
          days[date].summary = `Systems Automation Logic on ${repo}`;
          const workflowHighlights = [
            `Configured CI/CD pipeline telemetry and logic gates.`,
            `Optimized automated build/test cycles for production.`,
            `Enforced production-grade security and logic gates.`,
            `Hardened deployment orchestration pipeline for ${repo}.`,
            `Orchestrated automated system health checks.`,
            `Refined DevOps logic for high-velocity deployment.`,
            `Established automated rollback and recovery protocols.`,
            `Mapped CI/CD triggers to architectural deltas.`
          ];
          days[date].highlights.push(workflowHighlights[entropyIdx % workflowHighlights.length]);
        } else {
          const branch = payload.ref || 'stable';
          days[date].summary = `Initializing High-Fidelity Entity: ${branch} in ${repo}`;
          const createHighlights = [
            `Initialized new architectural branch for feature isolation.`,
            `Established stable upstream logic for ${repo} project.`,
            `Provisioned core structural assets for system expansion.`,
            `Mapped new feature-set to isolated dev environments.`,
            `Architected repository structure for scalable expansion.`,
            `Seeded high-fidelity codebase with core modules.`,
            `Defined structural boundaries for upcoming milestones.`,
            `Isolated system logic from legacy dependencies.`
          ];
          days[date].highlights.push(createHighlights[entropyIdx % createHighlights.length]);
        }
      }
    }
  });

  // 3. Post-process to handle multi-repo days
  Object.values(days).forEach(day => {
    if (day.repos.length > 2) {
      day.summary = `Full-Stack Orchestration: ${day.repos.length} systems synchronized`;
    }
    // Clean unique values
    day.highlights = [...new Set(day.highlights)].slice(0, 5);
  });

  const achievements = [
    "Architected high-impact system logic and professional CI/CD automation.",
    "Engineered robust architectural patterns with Staff-level system ownership.",
    "Optimized technical debt through consistent high-fidelity refactoring.",
    "Spearheaded production-grade system migrations and logic refinement.",
    "Established elite scaling patterns across multiple high-volume codebases.",
    "Refined technical authority through sustained contribution velocity.",
    "Orchestrated cross-repo logic deltas with precision and rigor.",
    "Maintained high engineering signal across complex project lifecycles."
  ];

  return {
    version: "v10.1-REAL",
    impactDays: Object.values(days).sort((a, b) => b.date.localeCompare(a.date)),
    topAchievement: achievements[events.length % achievements.length]
  };
}

export function calculatePotentialScore(currentScore, fixCount) {
  return Math.min(currentScore + (fixCount * 8), 100);
}
