import type { Plugin } from "@opencode-ai/plugin"

const SWAP_SCRIPT = "/home/johnbehrend/.config/opencode/scripts/switch-backend.sh"

export default (async ({ $ }) => {
  return {
    "chat.params": async (input, output) => {
      const provider = input.model.providerID
      const target = provider === "sglang" ? "sglang" : "vllm"
      await $`${SWAP_SCRIPT} ${target}`.nothrow()
    },
  }
}) satisfies Plugin
