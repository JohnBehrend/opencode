import type { JSX } from "solid-js"
import { registerPreviewer } from "./previewer"

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "tif", "tiff", "heic"])
const audioExtensions = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"])

function imagePreview(ctx: { src: string; path: string; onLoad?: () => void }): JSX.Element {
  return (
    <div class="flex justify-center bg-background-stronger px-6 py-4">
      <img
        src={ctx.src}
        alt={ctx.path}
        class="max-h-[60vh] max-w-full rounded border border-border-weak-base bg-background-base object-contain"
        onLoad={ctx.onLoad}
      />
    </div>
  )
}

function audioPreview(ctx: { src: string; mimeType?: string; onLoad?: () => void }): JSX.Element {
  return (
    <div class="flex justify-center bg-background-stronger px-6 py-4">
      <audio class="w-full max-w-xl" controls preload="metadata" onLoadedMetadata={ctx.onLoad}>
        <source src={ctx.src} type={ctx.mimeType} />
      </audio>
    </div>
  )
}

export function registerBuiltInPreviewers(): void {
  registerPreviewer({
    id: "builtin-image",
    extensions: imageExtensions,
    render: (ctx) => imagePreview({ src: ctx.src, path: ctx.path, onLoad: ctx.onLoad }),
  })

  registerPreviewer({
    id: "builtin-audio",
    extensions: audioExtensions,
    render: (ctx) => audioPreview({ src: ctx.src, mimeType: ctx.mimeType, onLoad: ctx.onLoad }),
  })
}
