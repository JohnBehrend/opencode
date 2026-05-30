import type { Plugin } from "@opencode-ai/plugin"

const SWAP_SCRIPT = "/home/johnbehrend/.config/opencode/scripts/switch-backend.sh"

type Target = "sglang" | "vllm" | "vllm2"

const PROVIDER_MAP: Record<string, Target> = {
  sglang: "sglang",
  vllm: "vllm",
  vllm2: "vllm2",
}

let lastTarget: Target | null = null
let pending: Promise<void> | null = null
let lastRun = 0

export default (async ({ $ }) => {
  return {
    "chat.params": async (input, output) => {
      const provider = input.model.providerID
      const target = PROVIDER_MAP[provider]

      if (!target) return
      if (lastTarget === target) return

      const now = Date.now()
      if (now - lastRun < 30000) return

      lastTarget = target
      lastRun = now

      if (pending) return
      pending = (async () => {
        await $`${SWAP_SCRIPT} ${target}`.nothrow()
        pending = null
      })()
    },
  }
}) satisfies Plugin
