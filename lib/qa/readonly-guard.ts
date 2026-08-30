const WRITE_SQL =
  /\b(INSERT|UPDATE|DELETE|MERGE|DROP|TRUNCATE|ALTER|GRANT|REVOKE|CREATE|COPY|CALL|DO|VACUUM|REINDEX|CLUSTER|COMMENT|SECURITY)\b/i

export const QA_DB_ROLE = "qa_agent"
export const OWNER_DB_ROLES = ["managekar", "postgres"] as const

export function databaseUserFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return decodeURIComponent(parsed.username || "") || null
  } catch {
    const match = url.match(/^postgres(?:ql)?:\/\/([^:/]+)@/i)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }
}

export function isOwnerDatabaseUrl(url: string): boolean {
  const user = databaseUserFromUrl(url)
  if (!user) {
    return false
  }
  return (OWNER_DB_ROLES as readonly string[]).includes(user)
}

export function isQaDatabaseUrl(url: string): boolean {
  return databaseUserFromUrl(url) === QA_DB_ROLE
}

export function assertQaDatabaseUrl(url: string): string {
  if (isOwnerDatabaseUrl(url)) {
    throw new Error(`QA refused owner database URL for role ${databaseUserFromUrl(url)}. Use ${QA_DB_ROLE}.`)
  }
  if (!isQaDatabaseUrl(url)) {
    throw new Error(`QA refused database URL. Role must be ${QA_DB_ROLE}, not ${databaseUserFromUrl(url) ?? "missing"}.`)
  }
  return url
}

export function stripSqlComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ")
}

export function isReadOnlySql(sql: string): boolean {
  const stripped = stripSqlComments(sql).trim()
  if (!stripped) {
    return false
  }
  return !WRITE_SQL.test(stripped)
}

export function assertReadOnlySql(sql: string): string {
  if (!isReadOnlySql(sql)) {
    throw new Error("QA refused mutating SQL. SELECT/EXPLAIN/SHOW only. Write cleanup to a review file.")
  }
  return sql
}
