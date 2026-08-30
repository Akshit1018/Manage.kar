export interface QaCleanupItem {
  surface: "pwa-localStorage" | "flutter-postgres"
  kind: "task" | "note" | "habit" | "account" | "other"
  id?: string
  title: string
  createdAt?: string
  proposed: string
}

export function formatQaCleanupFile(input: {
  date: string
  target: string
  items: QaCleanupItem[]
}): string {
  const rows = input.items
    .map((item, index) => {
      const id = item.id ? ` id=${item.id}` : ""
      return [
        `## ${index + 1}. ${item.kind}${id} — ${item.title}`,
        `Surface: ${item.surface}`,
        item.createdAt ? `Created: ${item.createdAt}` : undefined,
        "Proposed (do not run until a human checks the SELECT / UI):",
        "```",
        item.proposed,
        "```",
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n")
    })
    .join("\n\n")

  return [
    `# cleanup-${input.date}`,
    "",
    `Target: ${input.target}`,
    "Status: review only. The overnight agent must not execute these steps.",
    "",
    "Human decision per item: [ ] run  [ ] skip  [ ] escalate",
    "",
    rows || "_No leftover test rows._",
    "",
  ].join("\n")
}
