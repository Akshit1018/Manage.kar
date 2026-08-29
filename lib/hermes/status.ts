function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export interface HermesDashboardStatus {
  version: string
  gatewayRunning: boolean
  authRequired: boolean
  installId?: string
  overall?: string
}

export function parseHermesDashboardStatus(value: unknown): HermesDashboardStatus | null {
  if (!isRecord(value) || typeof value.version !== "string" || typeof value.gateway_running !== "boolean") {
    return null
  }
  return {
    version: value.version,
    gatewayRunning: value.gateway_running,
    authRequired: value.auth_required === true,
    ...(typeof value.install_id === "string" && value.install_id.trim() !== ""
      ? { installId: value.install_id.trim() }
      : {}),
    ...(typeof value.overall === "string" ? { overall: value.overall } : {}),
  }
}
