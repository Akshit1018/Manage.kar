import { describe, expect, it } from "vitest"
import { compactPairPayload, buildManagekarPairTicket } from "./plugin-pair"
import { encodeQrMatrix, qrMatrixToAscii, qrMatrixToSvg } from "./qr-byte"

function finderLooksRight(matrix: boolean[][], row: number, col: number): boolean {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const expected =
        x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
      if (matrix[row + y][col + x] !== expected) {
        return false
      }
    }
  }
  return true
}

describe("encodeQrMatrix", () => {
  it("places finder patterns on a compact pair payload", () => {
    const ticket = buildManagekarPairTicket({
      pairId: "aabbccddeeff0011",
      claimUrl: "http://10.0.0.4:9119/api/plugins/managekar/claim",
      expiresAt: "2026-08-29T17:10:00.000Z",
    })
    const matrix = encodeQrMatrix(compactPairPayload(ticket))
    expect(matrix.length).toBeGreaterThanOrEqual(21)
    expect(matrix.length % 4).toBe(1)
    expect(finderLooksRight(matrix, 0, 0)).toBe(true)
    expect(finderLooksRight(matrix, 0, matrix.length - 7)).toBe(true)
    expect(finderLooksRight(matrix, matrix.length - 7, 0)).toBe(true)
    expect(qrMatrixToSvg(matrix)).toContain("<svg")
    expect(qrMatrixToAscii(matrix)).toContain("██")
  })

  it("refuses a payload that cannot fit versions 1-6", () => {
    expect(() => encodeQrMatrix("x".repeat(400))).toThrow(/too long/i)
  })
})
