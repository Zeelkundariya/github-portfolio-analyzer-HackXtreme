import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getAIReview(prompt) {
    console.log("Initiating Gemini AI Audit...");
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here' || !process.env.GOOGLE_API_KEY.startsWith('AIza')) {
        console.warn("Gemini API Key missing or invalid.");
        throw new Error("Missing or invalid Google AI API Key");
    }
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Gemini Audit Successful.");
        return text;
    } catch (err) {
        console.error("Gemini API Error:", err.message);
        throw err;
    }
}

export async function getRevivalPlans(username, repos) {
    const techMissions = {
        javascript: [
            "Implement Recursive Type Definitions",
            "Add Architectural Class Diagram to README",
            "Configure Automated Documentation Pipeline",
            "Refactor to ES6+ Class Composition",
            "Implement Singleton Design Pattern for State",
            "Migration to Factory Pattern for Object Creation",
            "Add JSDoc for complex logic flows",
            "Implement Memoization for expensive calculations"
        ],
        typescript: [
            "Enable Strict Mode and resolve all 'any' types",
            "Automate API Documentation with TypeDoc",
            "Implement Unit Testing with 80% coverage",
            "Implement Utility Types for API responses",
            "Add Decorators for cross-cutting concerns",
            "Refactor to Abstract Interface patterns",
            "Setup strict TSLint rules for architecture",
            "Implement discriminated unions for state"
        ],
        python: [
            "Implement PEP8 Linting and type hinting",
            "Add Architectural Flowchart for data processing",
            "Setup Automated Pytest Pipeline",
            "Refactor to AsyncIO for I/O bound tasks",
            "Implement Decorators for logging/auth",
            "Add Pydantic models for data validation",
            "Implementation of Context Managers for resources",
            "Setup Poetry for modern dependency management"
        ],
        react: [
            "Refactor to High-Performance Composition patterns",
            "Add visual Storybook for Component isolation",
            "Optimize render performance with Memo/UseCallback",
            "Implement Custom Hooks for state separation",
            "Migration to Context API from prop drilling",
            "Add Error Boundaries for system resilience",
            "Transition to Atomic Design structure",
            "Implement HOCs for shared logic"
        ],
        docker: [
            "Optimize Layer Caching for faster deployments",
            "Implement Multi-stage builds for security",
            "Setup Automated Image Scanning",
            "Add Healthcheck probes for orchestration",
            "Minimize Image size with Alpine base",
            "Implement Secret management patterns",
            "Configure Compose for local microservices",
            "Setup Logging drivers for persistence"
        ],
        html: [
            "Refactor to Semantic HTML5 for SEO",
            "Implement Aria Roles for accessibility",
            "Add Meta tagging for Social Graph optimization",
            "Optimize asset loading with WebP/Lazy-loading",
            "Implement BEM naming for CSS sustainability",
            "Add critical path CSS for FCP speed",
            "Setup SASS/SCSS for modular styling",
            "Implement Responsive Design breakpoints"
        ]
    };

    const impactLevels = {
        low: "This upgrade will push your 'Engineering Depth' signal by +5%.",
        medium: "This upgrade will push your 'Engineering Depth' signal by +12%.",
        high: "This massive upgrade could push you into the 'Industry Authority' tier."
    };

    // Select top 3 repos by activity or stars for revival
    const candidates = repos
        .filter(r => !r.fork)
        .sort((a, b) => (b.stars * 2 + b.size / 100) - (a.stars * 2 + a.size / 100))
        .slice(0, 3);

    const plans = candidates.map((repo, index) => {
        const lang = (repo.language || "javascript").toLowerCase();
        let pool = [...(techMissions[lang] || techMissions.javascript)];

        // Better shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const tasks = pool.slice(0, 3);

        const impactRands = ["+11%", "+13%", "+16%", "+18%", "+21%"];
        const randomImpact = impactRands[(index + repo.size) % impactRands.length];
        const missionNames = ["WEEKEND MISSION LOG", "NIGHTLY ARCHITECTURE SPRINT", "TECHNICAL DEBT CLEARANCE", "HIGH-FIDELITY REFACTOR", "SYSTEM DESIGN SPRINT", "CODE QUALITY PUSH"];
        const missionName = missionNames[(index + repo.stars) % missionNames.length];

        const impact = repo.stars > 10
            ? `Special Reward: This massive upgrade could push you into the 'Industry Authority' tier.`
            : `Impact Upgrade: This refactor will push your 'Engineering Depth' signal by ${randomImpact}.`;

        const variations = [
            `High architectural signal in ${repo.language || 'codebase'} but lacks Tier-1 documentation.`,
            `Found significant code volume (${repo.size}KB) that is currently underselling your skills.`,
            `The complexity of this module suggests missed opportunities for professional signaling.`,
            `Untapped technical authority detected in legacy components of ${repo.name}.`
        ];
        const why = variations[index % variations.length];

        return {
            repo: repo.name,
            why,
            tasks,
            bonus: impact,
            missionName // Adding missionName for frontend use
        };
    });

    // Fallback if no repos
    if (plans.length === 0) {
        plans.push({
            repo: "New Masterpiece Project",
            why: "No local assets detected for revival. Architecture simulation required.",
            tasks: ["Initialize TypeScript Monorepo", "Setup CI/CD Actions", "Draft System Design Doc"],
            bonus: impactLevels.high
        });
    }

    return { plans };
}
export async function getChatResponse(username, messages, context) {
    console.log(`Processing chat for ${username}...`);

    // Prepare the system prompt with context
    const repoContext = context.allRepos?.slice(0, 5).map(r =>
        `- ${r.name}: ${r.description} (${r.language}, ${r.stars}⭐)`
    ).join('\n');

    const systemPrompt = `
        ROLE: You are the Lead Technical Recruiter at a Tier-1 silicon valley firm. 
        SUBJECT: Technical Audit Interview for candidate "${username}".
        CORE DATA: 
        - Score: ${context.score}/100
        - Role Fit: ${context.roleFit}
        - Top Repos:
        ${repoContext}

        INSTRUCTIONS:
        - Be professional, sharp, and slightly challenging.
        - Ask specific questions about their projects/repos.
        - Don't be generic; use the candidate's real GitHub telemetry.
        - Keep responses concise (under 3 sentences).
        - If they answer well, acknowledge it. If they are vague, push for architectural details.
    `;

    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here' || !process.env.GOOGLE_API_KEY.startsWith('AIza')) {
        // Fallback Logic
        const lastMsg = messages[messages.length - 1].content.toLowerCase();
        if (lastMsg.includes('hello') || lastMsg.includes('hi')) {
            return "Hello! I've been looking over your GitHub profile. Your work in " + (context.techStack?.[0]?.name || "modern tech") + " caught my eye. What was the most challenging architectural decision you made in " + (context.allRepos?.[0]?.name || "your main project") + "?";
        }
        return "That's an interesting perspective. How did you handle scalability and state management in that specific implementation? I'm looking for Staff-level insight.";
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert message format to Gemini's expected format if needed, 
        // but for simplicity we can just pass the latest history as a prompt.
        const chatHistory = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Recruiter'}: ${m.content}`).join('\n');

        const finalPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\n\nRecruiter:`;

        const result = await model.generateContent(finalPrompt);
        return result.response.text();
    } catch (err) {
        console.error("Gemini Chat Error:", err.message);
        return "Sorry, my technical assessment engine is experiencing latency. Let's focus on your " + (context.allRepos?.[0]?.name || "latest project") + ". Can you explain the structural logic there?";
    }
}
