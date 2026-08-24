import { PrismaClient } from "@prisma/client"
import { buildApp } from "./app.js"

const prisma = new PrismaClient()
const app = await buildApp(prisma)
const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? "0.0.0.0"

await app.listen({ port, host })
console.log(`Manage.kar API listening on http://${host}:${port}`)
