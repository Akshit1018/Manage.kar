import type { Workspace } from "@/lib/domain/types"

export const QUOTA_WARN_BYTES = 3_500_000

export function estimateWorkspaceBytes(workspace: Workspace): number {
  return new TextEncoder().encode(JSON.stringify(workspace)).length
}

export function shouldWarnQuota(bytes: number, limit = QUOTA_WARN_BYTES): boolean {
  return bytes >= limit
}
