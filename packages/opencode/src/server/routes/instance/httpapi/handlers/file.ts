import * as InstanceState from "@/effect/instance-state"
import { File } from "@/file"
import { Ripgrep } from "@/file/ripgrep"
import { AppFileSystem } from "@opencode-ai/core/filesystem"
import { Effect, Stream } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { InstanceHttpApi } from "../api"
import { join, relative, basename } from "path"

export const fileHandlers = HttpApiBuilder.group(InstanceHttpApi, "file", (handlers) =>
  Effect.gen(function* () {
    const svc = yield* File.Service
    const ripgrep = yield* Ripgrep.Service

    const findText = Effect.fn("FileHttpApi.findText")(function* (ctx: { query: { pattern: string } }) {
      return (yield* ripgrep
        .search({ cwd: (yield* InstanceState.context).directory, pattern: ctx.query.pattern, limit: 10 })
        .pipe(Effect.orDie)).items
    })

    const findFile = Effect.fn("FileHttpApi.findFile")(function* (ctx: {
      query: { query: string; dirs?: "true" | "false"; type?: "file" | "directory"; limit?: number }
    }) {
      return yield* svc.search({
        query: ctx.query.query,
        limit: ctx.query.limit ?? 10,
        dirs: ctx.query.dirs !== "false",
        type: ctx.query.type,
      })
    })

    const findSymbol = Effect.fn("FileHttpApi.findSymbol")(function* () {
      return []
    })

    const list = Effect.fn("FileHttpApi.list")(function* (ctx: { query: { path: string } }) {
      return yield* svc.list(ctx.query.path)
    })

    const content = Effect.fn("FileHttpApi.content")(function* (ctx: { query: { path: string } }) {
      return yield* svc.read(ctx.query.path)
    })

    const status = Effect.fn("FileHttpApi.status")(function* () {
      return yield* svc.status()
    })

    return handlers
      .handle("findText", findText)
      .handle("findFile", findFile)
      .handle("findSymbol", findSymbol)
      .handle("list", list)
      .handle("content", content)
      .handle("status", status)
  }),
)

export const audioStreamRoute = HttpRouter.use((router) =>
  Effect.gen(function* () {
    yield* router.add(
      "GET",
      "/file/audio",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const url = new URL(request.url, "http://localhost")
        const filePath = url.searchParams.get("path")
        if (!filePath) return HttpServerResponse.text("Missing path parameter", { status: 400 })

        const ctx = yield* InstanceState.context
        const full = join(ctx.directory, filePath)
        const rel = relative(ctx.directory, full)
        if (rel.startsWith("..") || rel === "") {
          return HttpServerResponse.text("Access denied", { status: 403 })
        }

        const fs = yield* AppFileSystem.Service
        const exists = yield* fs.existsSafe(full).pipe(Effect.catch(() => Effect.succeed(false)))
        if (!exists) return HttpServerResponse.text("File not found", { status: 404 })

        const stat = yield* fs.stat(full).pipe(Effect.catch(() => Effect.void))
        const size = stat?.type === "File" ? Number(stat.size) : undefined
        const mimeType = AppFileSystem.mimeType(full)
        const filename = basename(full)

        const bytes = yield* fs.readFile(full).pipe(
          Effect.catch(() => Effect.succeed(new Uint8Array())),
        )

        const rangeHeader = request.headers["range"]
        const range = parseRange(rangeHeader, size)

        if (range && size && bytes.length > 0) {
          const [start, end] = range
          const length = end - start + 1
          const chunk = bytes.slice(start, end + 1)

          return HttpServerResponse.stream(Stream.make(chunk), {
            status: 206,
            contentType: mimeType,
            headers: {
              "content-range": `bytes ${start}-${end}/${size}`,
              "content-length": String(length),
              "accept-ranges": "bytes",
              "content-disposition": `inline; filename="${filename}"`,
            },
          })
        }

        return HttpServerResponse.stream(Stream.make(bytes), {
          contentType: mimeType,
          headers: {
            "accept-ranges": "bytes",
            "content-length": size ? String(size) : "",
            "content-disposition": `inline; filename="${filename}"`,
          },
        })
      }),
    )
  }),
)

function parseRange(header: string | undefined, size: number | undefined): [number, number] | null {
  if (!header || !size) return null
  const match = header.match(/^bytes=(\d+)-(\d+)?$/)
  if (!match) return null
  const start = parseInt(match[1], 10)
  const end = match[2] ? parseInt(match[2], 10) : size - 1
  if (isNaN(start) || isNaN(end) || start < 0 || end >= size || start > end) return null
  return [start, end]
}
