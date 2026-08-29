export interface DeveloperGateInput {
  hash: string
  search: string
}

export function showSimulatedPairingControl(input: DeveloperGateInput): boolean {
  if (input.hash === "#dev") {
    return true
  }
  return /(?:^|[?&])dev=1(?:&|$)/.test(input.search)
}
