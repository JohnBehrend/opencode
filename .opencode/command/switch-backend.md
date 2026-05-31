---
description: Switch inference backend between SGLang (MiMo), vLLM (Qwen3), and vLLM2 (Step-3.7) on port 2136
subtask: true
---

Switch the active inference backend. The user must specify the target.

Run the script with the target backend:

!`~/.config/opencode/scripts/switch-backend.sh <mimo2|qwen3_27b|qwen3_35b|step3>`

The script will exit early if already on the target backend.
