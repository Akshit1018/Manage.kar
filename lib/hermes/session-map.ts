const hermesToDialer = new Map<string, string>()
const dialerToHermes = new Map<string, string>()

export function bindHermesSession(dialerSessionId: string, hermesSessionId: string): void {
  const dialer = dialerSessionId.trim()
  const hermes = hermesSessionId.trim()
  if (!dialer || !hermes) {
    return
  }
  hermesToDialer.set(hermes, dialer)
  dialerToHermes.set(dialer, hermes)
}

export function unbindHermesSession(dialerSessionId: string): void {
  const hermes = dialerToHermes.get(dialerSessionId)
  dialerToHermes.delete(dialerSessionId)
  if (hermes) {
    hermesToDialer.delete(hermes)
  }
}

export function dialerSessionForHermes(hermesSessionId?: string): string | undefined {
  if (!hermesSessionId) {
    return undefined
  }
  return hermesToDialer.get(hermesSessionId)
}

export function hermesSessionForDialer(dialerSessionId: string): string | undefined {
  return dialerToHermes.get(dialerSessionId)
}

export function resetHermesSessionMap(): void {
  hermesToDialer.clear()
  dialerToHermes.clear()
}

export function mapInboundSessionId(sessionId?: string): string | undefined {
  if (!sessionId) {
    return sessionId
  }
  return dialerSessionForHermes(sessionId) ?? sessionId
}

export function outboundHermesSessionId(dialerSessionId: string): string {
  return hermesSessionForDialer(dialerSessionId) ?? dialerSessionId
}
