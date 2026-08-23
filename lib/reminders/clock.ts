const TIME = /^(\d{1,2}):(\d{2})$/

export function localTimeReached(now: Date, reminderTime: string): boolean {
  const match = reminderTime.trim().match(TIME)
  if (!match) {
    return true
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return true
  }
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes
}
