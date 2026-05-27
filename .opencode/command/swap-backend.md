---
description: Swap inference backend between SGLang (MiMo) and vLLM (Qwen3) on port 2136
subtask: true
---

Swap the active inference backend. The user must specify the target.

Run the script with the target backend:

!`~/.config/opencode/scripts/switch-backend.sh <sglang|vllm>`

The script will exit early if already on the target backend.
