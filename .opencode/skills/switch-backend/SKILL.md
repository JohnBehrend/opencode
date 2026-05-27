---
name: switch-backend
description: Use when the user wants to switch between SGLang (MiMo) and vLLM (Qwen3) inference backends on port 2136.
---

# Switch Backend

Use this skill when the user asks to switch inference backends.

## Available Backends

| Backend | Model | Use for |
|---------|-------|---------|
| sglang | MiMo-V2.5-NVFP4 | Coding/debugging in opencode (uses GPUs 0+1) |
| vllm | Qwen3.6-27B-FP8 | Running scripts that need VRAM (uses GPU 1 only) |

## How to Switch

Run the script with the target backend:

```bash
~/.config/opencode/scripts/switch-backend.sh sglang
~/.config/opencode/scripts/switch-backend.sh vllm
```

The script:
- Kills the current backend
- Starts the new one
- Waits up to 600s for the model to load
- Exits early if already on the target

Both backends serve on port 2136 as `coder-model`. No config change needed.
