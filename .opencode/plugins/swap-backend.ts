import type { Plugin } from "@opencode-ai/plugin"

const SWAP_SCRIPT = "/home/johnbehrend/.config/opencode/scripts/switch-backend.sh"

type Target = "mimo2" | "qwen3_27b" | "qwen3_35b" | "step3"

const MODEL_MAP: Record<string, Target> = {
  "mimo2": "mimo2",
  "qwen3.6-27b": "qwen3_27b",
  "qwen3.6-35b": "qwen3_35b",
  "step3p7": "step3",
}

let lastTarget: Target | null = null
let pending: Promise<void> | null = null
let lastRun = 0

export default (async ({ $ }) => {
  return {
    "chat.params": async (input, output) => {
      const modelKey = input.model.providerID
      const target = MODEL_MAP[modelKey]
      if (!target) return
      if (lastTarget === target) return

      const now = Date.now()
      if (now - lastRun < 30000) return

      lastTarget = target
      lastRun = now
      console.log(`[swap-backend] switching to ${target}`)

      if (pending) return
      pending = (async () => {
        await $`${SWAP_SCRIPT} ${target}`.nothrow()
        pending = null
      })()
    },
  }
}) satisfies Plugin
