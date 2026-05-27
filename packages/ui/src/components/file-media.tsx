import type { FileContent } from "@opencode-ai/sdk/v2"
import { createEffect, createMemo, createResource, Match, on, Show, Switch, type JSX } from "solid-js"
import { useI18n } from "../context/i18n"
import {
  dataUrlFromMediaValue,
  fileExtension,
  hasMediaValue,
  isBinaryContent,
  mediaKindFromPath,
  normalizeMimeType,
  svgTextFromValue,
} from "../pierre/media"
import { resolvePreviewer, type PreviewerContext } from "../pierre/previewer"

const audioExtensions = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "m4b"])

export type FileMediaOptions = {
  mode?: "auto" | "off"
  path?: string
  current?: unknown
  before?: unknown
  after?: unknown
  deleted?: boolean
  readFile?: (path: string) => Promise<FileContent | undefined>
  baseServerUrl?: string
  authToken?: string
  onLoad?: () => void
  onError?: (ctx: { kind: "image" | "audio" | "svg" | string }) => void
}

function mediaValue(cfg: FileMediaOptions) {
  if (cfg.current !== undefined) return cfg.current
  return cfg.after ?? cfg.before
}

export function FileMedia(props: { media?: FileMediaOptions; fallback: () => JSX.Element }) {
  const i18n = useI18n()
  const cfg = () => props.media

  const previewer = createMemo(() => {
    const media = cfg()
    if (!media || media.mode === "off") return
    return resolvePreviewer(media.path)
  })

  const svgKind = createMemo(() => {
    const media = cfg()
    if (!media || media.mode === "off") return
    if (previewer()) return
    return mediaKindFromPath(media.path) === "svg" ? "svg" : undefined
  })

  const isBinary = createMemo(() => {
    const media = cfg()
    if (!media || media.mode === "off") return false
    if (previewer() || svgKind()) return false
    return isBinaryContent(media.current as any)
  })

  const onLoad = () => props.media?.onLoad?.()

  const deleted = createMemo(() => {
    const media = cfg()
    if (!media) return false
    if (media.deleted) return true
    if (media.current !== undefined) return false
    return !hasMediaValue(media.after as any) && hasMediaValue(media.before as any)
  })

  const previewerKind = createMemo(() => {
    const p = previewer()
    if (!p) return
    const ext = fileExtension(cfg()?.path)
    return { id: p.id, ext }
  })

  const streamUrl = createMemo(() => {
    const media = cfg()
    const pk = previewerKind()
    if (!media || !pk) return
    if (pk.ext !== "m4b" && !audioExtensions.has(pk.ext)) return
    if (!media.baseServerUrl || !media.path) return
    const url = `${media.baseServerUrl}/file/audio?path=${encodeURIComponent(media.path)}`
    if (media.authToken) return `${url}&auth_token=${encodeURIComponent(media.authToken)}`
    return url
  })

  const direct = createMemo(() => {
    const media = cfg()
    const pk = previewerKind()
    if (!media || !pk) return
    if (pk.ext === "m4b") return
    if (audioExtensions.has(pk.ext) && media.authToken) return
    return dataUrlFromMediaValue(mediaValue(media), pk.ext as "image" | "audio")
  })

  const request = createMemo(() => {
    const media = cfg()
    const pk = previewerKind()
    if (!media || !pk) return
    if (media.current !== undefined) return
    if (deleted()) return
    if (direct()) return
    if (streamUrl()) return
    if (!media.path || !media.readFile) return

    return {
      key: `${pk.id}:${media.path}`,
      kind: pk.ext as "image" | "audio",
      path: media.path,
      readFile: media.readFile,
      onError: media.onError,
    }
  })

  const [loaded] = createResource(request, async (input) => {
    return input.readFile(input.path).then(
      (result) => {
        const kind = input.kind as "image" | "audio"
        const src = dataUrlFromMediaValue(result as any, kind)
        if (!src) {
          input.onError?.({ kind: input.kind })
          return { key: input.key, error: true as const }
        }

        return {
          key: input.key,
          src,
          mime: kind === "audio" ? normalizeMimeType(result?.mimeType) : undefined,
        }
      },
      () => {
        input.onError?.({ kind: input.kind })
        return { key: input.key, error: true as const }
      },
    )
  })

  const remote = createMemo(() => {
    const input = request()
    const value = loaded()
    if (!input || !value || value.key !== input.key) return
    return value
  })

  const src = createMemo(() => {
    const value = remote()
    return direct() ?? streamUrl() ?? (value && "src" in value ? value.src : undefined)
  })
  const status = createMemo(() => {
    if (direct()) return "ready" as const
    if (streamUrl()) return "ready" as const
    if (!request()) return "idle" as const
    if (loaded.loading) return "loading" as const
    if (remote()?.error) return "error" as const
    if (src()) return "ready" as const
    return "idle" as const
  })
  const mimeType = createMemo(() => {
    const value = remote()
    if (value && "mime" in value) return value.mime
    const media = cfg()
    if (!media?.current) return
    const current = media.current as any
    if (typeof current?.mimeType === "string") return normalizeMimeType(current.mimeType)
    return
  })

  const svgSource = createMemo(() => {
    const media = cfg()
    if (!media || svgKind() !== "svg") return
    return svgTextFromValue(media.current as any)
  })
  const svgSrc = createMemo(() => {
    const media = cfg()
    if (!media || svgKind() !== "svg") return
    return dataUrlFromMediaValue(media.current as any, "svg")
  })
  const svgInvalid = createMemo(() => {
    const media = cfg()
    if (!media || svgKind() !== "svg") return
    if (svgSource() !== undefined) return
    if (!hasMediaValue(media.current as any)) return
    return [media.path, media.current] as const
  })

  createEffect(
    on(
      svgInvalid,
      (value) => {
        if (!value) return
        cfg()?.onError?.({ kind: "svg" })
      },
      { defer: true },
    ),
  )

  const kindLabel = (value: "image" | "audio" | string) => {
    const p = previewer()
    if (p?.label) return p.label
    return i18n.t(value === "image" ? "ui.fileMedia.kind.image" : "ui.fileMedia.kind.audio")
  }

  return (
    <Switch>
      <Match when={previewer()}>
        {(p) => {
          const previewerInstance = p()!
          return (
            <Show
              when={src()}
              fallback={(() => {
                const media = cfg()
                if (!media) return props.fallback()
                const label = kindLabel(previewerInstance.id)

                if (deleted()) {
                  return (
                    <div class="flex min-h-40 items-center justify-center px-6 py-4 text-center text-text-weak">
                      {i18n.t("ui.fileMedia.state.removed", { kind: label })}
                    </div>
                  )
                }
                if (status() === "loading") {
                  return (
                    <div class="flex min-h-40 items-center justify-center px-6 py-4 text-center text-text-weak">
                      {i18n.t("ui.fileMedia.state.loading", { kind: label })}
                    </div>
                  )
                }
                if (status() === "error") {
                  return (
                    <div class="flex min-h-40 items-center justify-center px-6 py-4 text-center text-text-weak">
                      {i18n.t("ui.fileMedia.state.error", { kind: label })}
                    </div>
                  )
                }
                return (
                  <div class="flex min-h-40 items-center justify-center px-6 py-4 text-center text-text-weak">
                    {i18n.t("ui.fileMedia.state.unavailable", { kind: label })}
                  </div>
                )
              })()}
            >
              {(value) => {
                const ctx: PreviewerContext = {
                  path: cfg()?.path ?? "",
                  src: value(),
                  mimeType: mimeType(),
                  content: cfg()?.current as FileContent | undefined,
                  onLoad,
                  onError: () => cfg()?.onError?.({ kind: previewerInstance.id }),
                }
                return previewerInstance.render(ctx)
              }}
            </Show>
          )
        }}
      </Match>
      <Match when={svgKind() === "svg"}>
        {(() => {
          if (svgSource() === undefined && svgSrc() == null) return props.fallback()

          return (
            <div class="flex flex-col gap-4 px-6 py-4">
              <Show when={svgSource() !== undefined}>{props.fallback()}</Show>
              <Show when={svgSrc()}>
                {(value) => (
                  <div class="flex justify-center">
                    <img
                      src={value()}
                      alt={cfg()?.path}
                      class="max-h-[60vh] max-w-full rounded border border-border-weak-base bg-background-base object-contain"
                      onLoad={onLoad}
                    />
                  </div>
                )}
              </Show>
            </div>
          )
        })()}
      </Match>
      <Match when={isBinary()}>
        <div class="flex min-h-56 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <div class="text-14-semibold text-text-strong">
            {cfg()?.path?.split("/").pop() ?? i18n.t("ui.fileMedia.binary.title")}
          </div>
          <div class="text-14-regular text-text-weak">
            {(() => {
              const path = cfg()?.path
              if (!path) return i18n.t("ui.fileMedia.binary.description.default")
              return i18n.t("ui.fileMedia.binary.description.path", { path })
            })()}
          </div>
        </div>
      </Match>
      <Match when={true}>{props.fallback()}</Match>
    </Switch>
  )
}
