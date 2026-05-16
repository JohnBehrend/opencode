import type { JSX } from "solid-js"
import { registerPreviewer } from "./previewer"

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "tif", "tiff", "heic"])
const audioExtensions = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"])
const downloadOnlyExtensions = new Set(["m4b"])

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

function downloadOnlyPreview(ctx: { src: string; path: string }): JSX.Element {
  const filename = ctx.path.split("/").pop() ?? ctx.path
  return (
    <div class="flex justify-center bg-background-stronger px-6 py-4">
      <a
        href={ctx.src}
        download={filename}
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors text-14-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {filename}
      </a>
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

  registerPreviewer({
    id: "builtin-download-only",
    extensions: downloadOnlyExtensions,
    render: (ctx) => downloadOnlyPreview({ src: ctx.src, path: ctx.path }),
  })
}
