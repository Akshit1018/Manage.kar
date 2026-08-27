import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import { buildApp } from "./app.js"

const prisma = new PrismaClient()
const webDir = resolve(process.env.FLUTTER_WEB_DIR ?? "../mobile/build/web")
const app = await buildApp(prisma, { webDir: existsSync(webDir) ? webDir : undefined })
const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? "0.0.0.0"

await app.listen({ port, host })
console.log(`Manage.kar API listening on http://${host}:${port}`)
if (existsSync(webDir)) {
  console.log(`Flutter web demo at http://${host}:${port}`)
}
