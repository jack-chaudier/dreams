# Contact and Collaboration Template

## Subject ideas

- A failure mode in long-context evals: valid-but-switched under compression
- Memory policies can look valid while silently changing the task
- Checkable safety contract for context compaction (demo + code)

## Short intro message

Hi <Name>,

I built a small public package called **MirageKit** around a long-context failure mode: under naive compression, answer validity can stay high while the model silently switches pivots (semantic drift). I’m sharing a 2-minute interactive demo, reproducible benchmark artifacts, and a production MCP implementation of contract-guarded tropical compaction.

- Demo page: https://dreams-dun.vercel.app
- Repo: https://github.com/jack-chaudier/dreams
- Key results: l2-guarded keeps pivot preservation at 1.0 under pressure in the included replay, while recency drops to 0.0 at the same budgets.

If this is relevant to your memory/eviction stack, I’d love to compare on your internal traces or collaborate on a broader eval pass.

Best,
<Your name>

## Suggested links

1. Demo URL (first click)
2. Repo URL (implementation + results)
3. One screenshot/GIF of slider + divergence
4. Optional: certificate JSON example
