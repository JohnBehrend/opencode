import type { Plugin } from "@opencode-ai/plugin"

const SWAP_SCRIPT = "/home/johnbehrend/.config/opencode/scripts/switch-backend.sh"

let lastTarget: "sglang" | "vllm" | null = null
let pending: Promise<void> | null = null
let lastRun = 0

export default (async ({ $ }) => {
  return {
    "chat.params": async (input, output) => {
      const provider = input.model.providerID
      const target = provider === "sglang" ? "sglang" : "vllm"

      if (lastTarget === target) return

      const now = Date.now()
      if (now - lastRun < 30000) return

      const current = (await $`${SWAP_SCRIPT}`.nothrow().text()).trim()
      if (current === target) {
        lastTarget = target
        lastRun = now
        return
      }

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
