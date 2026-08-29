export interface MachineSkill {
  name: string
  description?: string
  enabled: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseMachineSkills(value: unknown): MachineSkill[] {
  if (!Array.isArray(value)) {
    return []
  }
  const skills: MachineSkill[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== "string" || item.name.trim() === "") {
      continue
    }
    const description =
      typeof item.description === "string" && item.description.trim() !== ""
        ? item.description.trim().slice(0, 200)
        : undefined
    skills.push({
      name: item.name.trim().slice(0, 80),
      ...(description ? { description } : {}),
      enabled: item.enabled !== false,
    })
  }
  return skills
}

export function skillsOnMachine(input: { paired: boolean; reported: unknown }): MachineSkill[] {
  if (!input.paired) {
    return []
  }
  return parseMachineSkills(input.reported)
}

export function skillsAreInstallable(): boolean {
  return false
}

export function skillsEmptyCopy(paired: boolean): { title: string; description: string } {
  if (!paired) {
    return {
      title: "Skills live on the machine",
      description: "Pair a Hermes computer to see skills installed there. This app does not install or sell skills.",
    }
  }
  return {
    title: "No skills listed yet",
    description: "This machine has not reported skills. Refresh after pairing for real — nothing is installed from here.",
  }
}
