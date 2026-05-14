import type { FileContent } from "@opencode-ai/sdk/v2"
import type { JSX } from "solid-js"

export type PreviewerContext = {
  path: string
  src: string
  mimeType?: string
  content?: FileContent
  onLoad?: () => void
  onError?: () => void
}

export type PreviewerRender = (ctx: PreviewerContext) => JSX.Element

export type PreviewerPlugin = {
  id: string
  label?: string
  extensions: Set<string>
  mimeTypes?: string[]
  render: PreviewerRender
}

type PreviewerEntry = {
  previewer: PreviewerPlugin
  extension: string
}

const registry = new Map<string, PreviewerEntry>()

export function registerPreviewer(previewer: PreviewerPlugin): void {
  for (const ext of previewer.extensions) {
    const lower = ext.toLowerCase()
    registry.set(lower, { previewer, extension: lower })
  }
}

export function unregisterPreviewer(id: string): void {
  for (const [ext, entry] of registry) {
    if (entry.previewer.id === id) {
      registry.delete(ext)
    }
  }
}

export function resolvePreviewer(path: string | undefined): PreviewerPlugin | undefined {
  if (!path) return
  const idx = path.lastIndexOf(".")
  if (idx === -1) return
  const ext = path.slice(idx + 1).toLowerCase()
  return registry.get(ext)?.previewer
}

export function getPreviewers(): PreviewerPlugin[] {
  const seen = new Set<string>()
  const result: PreviewerPlugin[] = []
  for (const entry of registry.values()) {
    if (!seen.has(entry.previewer.id)) {
      seen.add(entry.previewer.id)
      result.push(entry.previewer)
    }
  }
  return result
}

export function clearPreviewers(): void {
  registry.clear()
}
