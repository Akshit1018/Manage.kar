import { Package } from "lucide-react"
import { skillsAreInstallable, skillsEmptyCopy, skillsOnMachine } from "@/lib/hermes/skills"

interface SkillsOnMachineProps {
  paired: boolean
  reported?: unknown
}

export function SkillsOnMachine({ paired, reported = [] }: SkillsOnMachineProps) {
  const skills = skillsOnMachine({ paired, reported })
  const empty = skillsEmptyCopy(paired)

  return (
    <section className="mk-editorial-card space-y-3 p-4" aria-label="Skills on this machine">
      <div className="mk-meta-row">
        <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">Skills on this machine</h3>
      </div>
      {skills.length === 0 ? (
        <div>
          <p className="text-sm font-medium">{empty.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{empty.description}</p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {skills.map((skill) => (
            <li key={skill.name} className="min-w-0">
              <p className="font-medium">{skill.name}</p>
              {skill.description ? <p className="text-sm text-muted-foreground">{skill.description}</p> : null}
              <p className="text-xs text-muted-foreground">{skill.enabled ? "On the machine" : "Listed, off"}</p>
            </li>
          ))}
        </ul>
      )}
      {skillsAreInstallable() ? null : (
        <p className="text-xs text-muted-foreground">Read-only. There is no plugin store in this app.</p>
      )}
    </section>
  )
}
