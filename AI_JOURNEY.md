# AI Journey

This project was not built by passively accepting AI output. It was a very active collaboration where I kept refining the system until it matched the kind of engineering standard I wanted: clean structure, clear boundaries, realistic architecture, and no unnecessary complexity.

A few prompts had the biggest impact on the final shape of the system.

The first was when I pushed the backend toward a completely GCP-native design instead of layering extra queueing tools on top of Pub/Sub. That decision helped simplify the event pipeline and made the system feel more aligned with the actual assessment requirements.

The second was when I introduced tenant authentication properly. Rather than allowing the client to keep sending `tenantId`, I wanted tenant identity to come from authenticated context. That changed the system from a simple event collector into something that felt much more like a real multi-tenant backend.

The third was my repeated insistence on avoiding overengineering. That probably shaped the project as much as any technical decision. I wanted senior-level structure, but I also wanted the code to stay understandable. For me, “senior” should mean cleaner and more intentional, not more confusing.

One of the clearest places where the AI went wrong was when it started suggesting a more complicated runtime and infrastructure model than the project actually needed. At that point, the solution was drifting into something that felt more like architectural noise than good engineering. I had to pull it back and make it clear that I needed thoughtful decisions, not inflated complexity. That reset ended up improving the project significantly.

Overall, the most valuable part of the process was not just using AI to generate ideas, but using engineering judgment to challenge, simplify, and correct those ideas until the result felt right.
