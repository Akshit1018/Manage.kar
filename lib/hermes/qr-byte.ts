/**
 * Byte-mode QR (versions 1–6, error level L) for host pairing payloads.
 * Short claim URLs fit; the full JSON ticket is copied as text, not encoded.
 */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(() => {
  let value = 1
  for (let index = 0; index < 255; index += 1) {
    EXP[index] = value
    LOG[value] = index
    value <<= 1
    if (value & 0x100) {
      value ^= 0x11d
    }
  }
  for (let index = 255; index < 512; index += 1) {
    EXP[index] = EXP[index - 255]
  }
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0
  }
  return EXP[LOG[a] + LOG[b]]
}

function rsGenerator(degree: number): number[] {
  let poly = [1]
  for (let index = 0; index < degree; index += 1) {
    const next = new Array<number>(poly.length + 1).fill(0)
    for (let cursor = 0; cursor < poly.length; cursor += 1) {
      next[cursor] ^= poly[cursor]
      next[cursor + 1] ^= gfMul(poly[cursor], EXP[index])
    }
    poly = next
  }
  return poly
}

function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGenerator(ecCount)
  const buffer = data.concat(new Array<number>(ecCount).fill(0))
  for (let index = 0; index < data.length; index += 1) {
    const factor = buffer[index]
    if (!factor) {
      continue
    }
    for (let cursor = 0; cursor < gen.length; cursor += 1) {
      buffer[index + cursor] ^= gfMul(gen[cursor], factor)
    }
  }
  return buffer.slice(data.length)
}

interface VersionSpec {
  version: number
  size: number
  dataCodewords: number
  ecCount: number
  blocks: number
  alignment: number[]
}

const VERSIONS: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 19, ecCount: 7, blocks: 1, alignment: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCount: 10, blocks: 1, alignment: [18] },
  { version: 3, size: 29, dataCodewords: 55, ecCount: 15, blocks: 1, alignment: [22] },
  { version: 4, size: 33, dataCodewords: 80, ecCount: 20, blocks: 1, alignment: [26] },
  { version: 5, size: 37, dataCodewords: 108, ecCount: 26, blocks: 1, alignment: [30] },
  { version: 6, size: 41, dataCodewords: 136, ecCount: 36, blocks: 2, alignment: [34] },
]

const FORMAT_L = [
  "111011111000100",
  "111001011110011",
  "111110110101010",
  "111100010011101",
  "110011000101111",
  "110001100011000",
  "110110001000001",
  "110100101110110",
]

function pickVersion(byteLength: number): VersionSpec {
  const neededBits = 4 + 8 + byteLength * 8 + 4
  const neededCodewords = Math.ceil(neededBits / 8)
  const spec = VERSIONS.find((item) => item.dataCodewords >= neededCodewords)
  if (!spec) {
    throw new Error("pairing payload is too long for a host QR")
  }
  return spec
}

function encodeData(bytes: number[], spec: VersionSpec): number[] {
  const bits: number[] = []
  const push = (value: number, width: number) => {
    for (let index = width - 1; index >= 0; index -= 1) {
      bits.push((value >> index) & 1)
    }
  }
  push(0b0100, 4)
  push(bytes.length, 8)
  for (const byte of bytes) {
    push(byte, 8)
  }
  push(0, 4)
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }
  const codewords: number[] = []
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0
    for (let cursor = 0; cursor < 8; cursor += 1) {
      value = (value << 1) | bits[index + cursor]
    }
    codewords.push(value)
  }
  const pads = [0xec, 0x11]
  let padIndex = 0
  while (codewords.length < spec.dataCodewords) {
    codewords.push(pads[padIndex % 2])
    padIndex += 1
  }
  if (spec.blocks === 1) {
    return codewords.concat(rsEncode(codewords, spec.ecCount))
  }
  const blockLen = spec.dataCodewords / spec.blocks
  const ecLen = spec.ecCount / spec.blocks
  const blocks = Array.from({ length: spec.blocks }, (_, index) =>
    codewords.slice(index * blockLen, (index + 1) * blockLen),
  )
  const ecc = blocks.map((block) => rsEncode(block, ecLen))
  const interleaved: number[] = []
  for (let index = 0; index < blockLen; index += 1) {
    for (const block of blocks) {
      interleaved.push(block[index])
    }
  }
  for (let index = 0; index < ecLen; index += 1) {
    for (const block of ecc) {
      interleaved.push(block[index])
    }
  }
  return interleaved
}

type Cell = boolean | null

function placeFinder(grid: Cell[][], row: number, col: number): void {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const rr = row + y
      const cc = col + x
      if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid.length) {
        continue
      }
      if (x === -1 || y === -1 || x === 7 || y === 7) {
        grid[rr][cc] = false
        continue
      }
      grid[rr][cc] =
        x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
    }
  }
}

function placeAlignment(grid: Cell[][], center: number): void {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      grid[center + y][center + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1
    }
  }
}

function reserved(grid: Cell[][], row: number, col: number): boolean {
  return grid[row][col] !== null
}

function applyFormat(grid: Cell[][], mask: number): void {
  const bits = FORMAT_L[mask]
  const size = grid.length
  const positions: Array<[number, number]> = []
  for (let index = 0; index < 6; index += 1) {
    positions.push([8, index])
  }
  positions.push([8, 7], [8, 8], [7, 8])
  for (let index = 5; index >= 0; index -= 1) {
    positions.push([index, 8])
  }
  bits.split("").forEach((bit, index) => {
    const [row, col] = positions[index]
    grid[row][col] = bit === "1"
  })
  const copy: Array<[number, number]> = []
  for (let index = 0; index < 8; index += 1) {
    copy.push([size - 1 - index, 8])
  }
  for (let index = 0; index < 7; index += 1) {
    copy.push([8, size - 7 + index])
  }
  bits.split("").forEach((bit, index) => {
    const [row, col] = copy[index]
    grid[row][col] = bit === "1"
  })
}

type QrMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

function maskBit(mask: QrMask, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0
    case 1:
      return row % 2 === 0
    case 2:
      return col % 3 === 0
    case 3:
      return (row + col) % 3 === 0
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
    default: {
      const _exhaustive: never = mask
      return _exhaustive
    }
  }
}

function fillData(grid: Cell[][], codewords: number[], mask: QrMask): void {
  const size = grid.length
  const bits: number[] = []
  for (const word of codewords) {
    for (let index = 7; index >= 0; index -= 1) {
      bits.push((word >> index) & 1)
    }
  }
  let bit = 0
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) {
      col -= 1
    }
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step
      for (const offset of [0, 1]) {
        const cc = col - offset
        if (reserved(grid, row, cc)) {
          continue
        }
        const dark = bit < bits.length ? bits[bit] === 1 : false
        bit += 1
        grid[row][cc] = maskBit(mask, row, cc) ? !dark : dark
      }
    }
    upward = !upward
  }
}

export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text))
  const spec = pickVersion(bytes.length)
  const codewords = encodeData(bytes, spec)
  const size = spec.size
  const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill(null))
  placeFinder(grid, 0, 0)
  placeFinder(grid, 0, size - 7)
  placeFinder(grid, size - 7, 0)
  for (const center of spec.alignment) {
    placeAlignment(grid, center)
  }
  for (let index = 8; index < size - 8; index += 1) {
    grid[6][index] = index % 2 === 0
    grid[index][6] = index % 2 === 0
  }
  grid[size - 8][8] = true
  const mask: QrMask = 0
  applyFormat(grid, mask)
  fillData(grid, codewords, mask)
  return grid.map((row) => row.map((cell) => cell === true))
}

export function qrMatrixToSvg(matrix: boolean[][], module = 6): string {
  const size = matrix.length * module
  const rects = matrix
    .flatMap((row, y) =>
      row.flatMap((on, x) =>
        on ? `<rect x="${x * module}" y="${y * module}" width="${module}" height="${module}"/>` : [],
      ),
    )
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`
}

export function qrMatrixToAscii(matrix: boolean[][]): string {
  const pad = (row: boolean[]) => [false, false, ...row, false, false]
  const blank = pad(matrix[0].map(() => false))
  const rows = [blank, blank, ...matrix.map(pad), blank, blank]
  return rows
    .map((row) => row.map((on) => (on ? "██" : "  ")).join(""))
    .join("\n")
}
