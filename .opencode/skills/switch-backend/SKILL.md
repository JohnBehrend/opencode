---
name: switch-backend
description: Use when the user wants to switch between SGLang (MiMo) and vLLM backends on port 2136.
---

# Switch Backend

Use this skill when the user asks to switch inference backends.

## Available Backends

| Backend | Model | GPU | Run method |
|---------|-------|-----|------------|
| mimo2 | MiMo-V2.5-NVFP4 | 0+1 | Docker container |
| qwen3_27b | Qwen3.6-27B-FP8 | 1 | uv run vllm |
| qwen3_35b | Qwen3.6-35B-A3B-NVFP4 | 1 | uv run vllm |
| step3 | Step-3.7-Flash-NVFP4 | all | Docker container |

## How to Switch

Run the script with the target backend:

```bash
~/.config/opencode/scripts/switch-backend.sh mimo2
~/.config/opencode/scripts/switch-backend.sh qwen3_27b
~/.config/opencode/scripts/switch-backend.sh qwen3_35b
~/.config/opencode/scripts/switch-backend.sh step3
```

The script:
- Kills the current backend
- Starts the new one
- Waits up to 600s for the model to load
- Exits early if already on the target

All backends serve on port 2136 as `coder-model`. After switching, restart opencode so it loads the new model.
