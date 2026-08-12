import { createSignal, Show } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import FileTreeV2 from "@/components/file-tree-v2"
import { useFile } from "@/context/file"
import { useLanguage } from "@/context/language"
import { SessionFileView } from "@/pages/session/file-tabs"
import { useSessionLayout } from "@/pages/session/session-layout"

export function MobileFileBrowser(props: { activeTab: () => string | undefined }) {
  const file = useFile()
  const language = useLanguage()
  const { tabs } = useSessionLayout()
  const [preview, setPreview] = createSignal<string>()

  const open = (path: string) => {
    const tab = file.tab(path)
    tabs().open(tab)
    tabs().setActive(tab)
    if (!path.endsWith(".m4b")) file.load(path)
    setPreview(tab)
  }

  return (
    <div class="h-full flex flex-col bg-background-stronger">
      <Show
        when={preview()}
        fallback={
          <>
            <div class="flex items-center gap-2 px-3 h-11 shrink-0 border-b border-border-weaker-base">
              <span class="text-14-medium text-text-strong">{language.t("session.files.all")}</span>
            </div>
            <ScrollView class="flex-1 min-h-0">
              <FileTreeV2
                active={file.pathFromTab(props.activeTab() ?? "")}
                kinds={new Map()}
                draggable={false}
                onFileClick={(node) => open(node.path)}
                onFileDoubleClick={(node) => open(node.path)}
              />
            </ScrollView>
          </>
        }
      >
        {(tab) => (
          <>
            <div class="flex items-center gap-1 px-2 h-11 shrink-0 border-b border-border-weaker-base">
              <IconButton
                icon="arrow-left"
                variant="ghost"
                aria-label={language.t("common.back")}
                onClick={() => setPreview()}
              />
              <span class="text-14-medium text-text-strong truncate">{language.t("session.files.all")}</span>
            </div>
            <div class="min-h-0 flex-1">
              <SessionFileView tab={tab()} />
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
