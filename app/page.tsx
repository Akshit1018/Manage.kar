import { Dashboard } from "@/components/workspace/dashboard"
import { parseWorkspaceSearch } from "@/lib/navigation/workspace-url"

function searchFromParams(params: Record<string, string | string[] | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      search.set(key, value)
    }
  }
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ""
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  return <Dashboard initialSearch={parseWorkspaceSearch(searchFromParams(params))} />
}
