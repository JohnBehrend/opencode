import { createEffect, createMemo, createSignal, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { useFileComponent } from "@opencode-ai/ui/context/file"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useFile } from "@/context/file"
import { useSDK } from "@/context/sdk"
import { useLanguage } from "@/context/language"

export function MobileFileBrowser(props: {
  class?: string
}) {
  const file = useFile()
  const sdk = useSDK()
  const language = useLanguage()
  const fileComponent = useFileComponent()
  const [selectedPath, setSelectedPath] = createSignal<string | null>(null)

  const readFile = async (path: string) => {
    return sdk.client.file
      .read({ path })
      .then((x) => x.data)
      .catch(() => undefined)
  }

  const selected = createMemo(() => selectedPath())
  const selectedState = createMemo(() => {
    const p = selected()
    if (!p) return
    return file.get(p)
  })

  const isM4b = createMemo(() => {
    const p = selected()
    return p?.endsWith(".m4b") ?? false
  })

  const renderFile = () => {
    const p = selected()
    const state = selectedState()
    if (!p) return null

    return (
      <Dynamic
        component={fileComponent}
        mode="text"
        file={{
          name: p,
          contents: state?.content?.content ?? "",
          cacheKey: state?.content?.content ?? "",
        }}
        media={{
          mode: "auto",
          path: p,
          current: state?.content,
          readFile,
        }}
      />
    )
  }

  const handleFileClick = (node: { path: string; type: string }) => {
    if (node.type === "file") {
      setSelectedPath(node.path)
      if (!node.path.endsWith(".m4b")) file.load(node.path)
    }
  }

  return (
    <div class={`flex flex-col h-full ${props.class ?? ""}`}>
      <Show when={selected()} keyed>
        {(p) => (
          <div class="flex items-center gap-2 px-3 py-2 border-b border-border-weaker-base text-12-medium text-text-weak">
            <button
              class="cursor-pointer hover:text-text-strong"
              onClick={() => setSelectedPath(null)}
            >
              {language.t("session.files.all")}
            </button>
            <span>/</span>
            <span class="truncate">{p.split("/").pop() ?? p}</span>
          </div>
        )}
      </Show>
      <ScrollView class="flex-1 min-h-0">
        <Show when={!selected()} keyed>
          <div class="flex-1 min-h-0">
            <FileTreeMobile
              path=""
              onFileClick={handleFileClick}
            />
          </div>
        </Show>
        <Show when={selected()} keyed>
          <div class="min-h-0">{renderFile()}</div>
        </Show>
      </ScrollView>
    </div>
  )
}

function FileTreeMobile(props: {
  path: string
  onFileClick: (node: { path: string; type: string }) => void
}) {
  const file = useFile()
  const language = useLanguage()

  createEffect(() => {
    const dir = file.tree.state(props.path)
    if (!dir?.loaded && !dir?.loading) {
      void file.tree.list(props.path)
    }
  })

  const dirState = createMemo(() => file.tree.state(props.path))
  const nodes = createMemo(() => file.tree.children(props.path))
  const isLoading = createMemo(() => dirState()?.loading === true)
  const isLoaded = createMemo(() => dirState()?.loaded === true)

  return (
    <div class="flex flex-col gap-0.5">
      <Show when={isLoading()}>
        <div class="px-4 py-2 text-12-regular text-text-weak">
          {language.t("common.loading")}...
        </div>
      </Show>
      <Show when={isLoaded() && nodes().length === 0}>
        <div class="px-4 py-2 text-12-regular text-text-weak">
          {language.t("session.files.selectToOpen")}
        </div>
      </Show>
      {nodes().map((node) => {
        const expanded = () => file.tree.state(node.path)?.expanded ?? false

        if (node.type === "directory") {
          return (
            <div>
              <button
                class="w-full h-6 flex items-center justify-start gap-x-1.5 rounded-md px-1.5 py-0 text-left hover:bg-surface-raised-base-hover active:bg-surface-base-active transition-colors cursor-pointer text-12-medium whitespace-nowrap truncate"
                style={`padding-left: ${Math.max(0, 8 + 8)}px`}
                onClick={() =>
                  expanded()
                    ? file.tree.collapse(node.path)
                    : file.tree.expand(node.path)
                }
              >
                <div class="size-4 flex items-center justify-center text-icon-weak">
                  <span>{expanded() ? "▾" : "▸"}</span>
                </div>
                <span class="flex-1 min-w-0 text-12-medium whitespace-nowrap truncate">{node.name}</span>
              </button>
              <Show when={expanded()}>
                <FileTreeMobile
                  path={node.path}
                  onFileClick={props.onFileClick}
                />
              </Show>
            </div>
          )
        }

        return (
          <button
            class="w-full h-6 flex items-center justify-start gap-x-1.5 rounded-md px-1.5 py-0 text-left hover:bg-surface-raised-base-hover active:bg-surface-base-active transition-colors cursor-pointer text-12-medium whitespace-nowrap truncate"
            style={`padding-left: ${Math.max(0, 8 + 8)}px`}
            onClick={() => props.onFileClick(node)}
          >
            <div class="w-4 shrink-0" />
            <span class="flex-1 min-w-0 text-12-medium whitespace-nowrap truncate">{node.name}</span>
          </button>
        )
      })}
    </div>
  )
}
