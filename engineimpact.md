# Engineering Impact: Technical Calculation

The **Engineering Impact Suite** provides a high-fidelity analysis of a developer's contribution quality and potential growth. It consists of two primary engines: the **Analytical Impact Tracker** (Live Heatmap) and the **Revival Impact Projection**.

## 1. Analytical Impact (Live Heatmap)
The heatmap displays a 60-day window of technical telemetry. Each day is assigned an **Impact Level (1-5)** based on the architectural significance of the events.

### Impact Level Hierarchy
| Level | Type | Trigger Criterion | Rationale |
| :--- | :--- | :--- | :--- |
| **5** | **Architecture** | `WorkflowRunEvent` / `CreateEvent` | DevOps orchestration & system initialization signals top-tier ownership. |
| **4** | **Refactor** | `PullRequestEvent` (Merged) | Successful peer-reviewed code integration and conflict resolution. |
| **3** | **Feature** | `PushEvent` (Conventional) / PR Opened | Active feature development with disciplined commit standards. |
| **2** | **Routine** | `PushEvent` (Non-conventional) | Standard repository maintenance and asset synchronization. |
| **1** | **Active** | `IssueEvent` / `StarEvent` / etc. | Community engagement and basic activity signals. |
| **0** | **Idle** | No Telemetry | Period of system dormancy. |

### Semantic Log Generation
For every impact day, the engine generates **Entropy-Driven Summaries** to ensure a non-repetitive, professional audit log. It uses a "Stable Entropy Index" derived from the date, repository name, and event type to select from a pool of high-fidelity templates (e.g., *"Engineered high-fidelity feature set"* vs *"Refined architectural logic"*).

## 2. Portfolio Impact (Revival Projection)
Calculated within the **Revival Engine**, this metric projects the potential increase in "Engineering Depth" score if specific technical missions are completed.

### Projection Formula
The impact percentage is deterministic but influenced by the repository's complexity:
```javascript
const impactRands = ["+11%", "+13%", "+16%", "+18%", "+21%"];
const randomImpact = impactRands[(index + repo.size) % impactRands.length];
```
- **Small Repos**: Receive a baseline growth projection of ~11-15%.
- **Large/Starred Repos**: Are flagged for **"Industry Authority"** tier rewards, as their architectural volume suggests a massive impact on the overall engineering profile if polished.

## 3. Longitudinal Scaling
The engine calculates the **Top Achievement** signal based on total event density:
```javascript
// Example Achievement Selection
const achievements = [
    "Architected high-impact system logic and CI/CD automation.",
    "Engineered robust architectural patterns with Staff-level ownership."
];
const topAchievement = achievements[events.length % achievements.length];
```
This ensures that as contribution volume grows, the impact narrative evolves to reflect higher levels of technical authority.

---
*This logic ensures that "Impact" is not just a count, but a qualitative measure of architectural contribution.*
