"""Tiny byte-mode QR (versions 1-5, level L) for ASCII host display."""

from __future__ import annotations

EXP = [0] * 512
LOG = [0] * 256
_value = 1
for _i in range(255):
    EXP[_i] = _value
    LOG[_value] = _i
    _value <<= 1
    if _value & 0x100:
        _value ^= 0x11D
for _i in range(255, 512):
    EXP[_i] = EXP[_i - 255]


def _mul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return EXP[LOG[a] + LOG[b]]


def _rs_gen(degree: int) -> list[int]:
    poly = [1]
    for index in range(degree):
        nxt = [0] * (len(poly) + 1)
        for cursor, coef in enumerate(poly):
            nxt[cursor] ^= coef
            nxt[cursor + 1] ^= _mul(coef, EXP[index])
        poly = nxt
    return poly


def _rs_encode(data: list[int], ec_count: int) -> list[int]:
    gen = _rs_gen(ec_count)
    buf = data + [0] * ec_count
    for index, _ in enumerate(data):
        factor = buf[index]
        if not factor:
            continue
        for cursor, coef in enumerate(gen):
            buf[index + cursor] ^= _mul(coef, factor)
    return buf[len(data) :]


VERSIONS = [
    (1, 21, 19, 7, []),
    (2, 25, 34, 10, [18]),
    (3, 29, 55, 15, [22]),
    (4, 33, 80, 20, [26]),
    (5, 37, 108, 26, [30]),
]

FORMAT_L0 = "111011111000100"


def encode_matrix(text: str) -> list[list[bool]]:
    data = list(text.encode("utf-8"))
    needed = (4 + 8 + len(data) * 8 + 4 + 7) // 8
    spec = next((item for item in VERSIONS if item[2] >= needed), None)
    if spec is None:
        raise ValueError("payload too long for ASCII QR")
    _version, size, data_cw, ec_count, alignment = spec
    bits: list[int] = []

    def push(value: int, width: int) -> None:
        for shift in range(width - 1, -1, -1):
            bits.append((value >> shift) & 1)

    push(0b0100, 4)
    push(len(data), 8)
    for byte in data:
        push(byte, 8)
    push(0, 4)
    while len(bits) % 8:
        bits.append(0)
    codewords = []
    for index in range(0, len(bits), 8):
        value = 0
        for bit in bits[index : index + 8]:
            value = (value << 1) | bit
        codewords.append(value)
    pads = [0xEC, 0x11]
    pad_i = 0
    while len(codewords) < data_cw:
        codewords.append(pads[pad_i % 2])
        pad_i += 1
    stream = codewords + _rs_encode(codewords, ec_count)

    grid: list[list[bool | None]] = [[None] * size for _ in range(size)]

    def finder(row: int, col: int) -> None:
        for y in range(-1, 8):
            for x in range(-1, 8):
                rr, cc = row + y, col + x
                if not (0 <= rr < size and 0 <= cc < size):
                    continue
                if x in (-1, 7) or y in (-1, 7):
                    grid[rr][cc] = False
                else:
                    grid[rr][cc] = x in (0, 6) or y in (0, 6) or (2 <= x <= 4 and 2 <= y <= 4)

    finder(0, 0)
    finder(0, size - 7)
    finder(size - 7, 0)
    for center in alignment:
        for y in range(-2, 3):
            for x in range(-2, 3):
                grid[center + y][center + x] = max(abs(x), abs(y)) != 1
    for index in range(8, size - 8):
        grid[6][index] = index % 2 == 0
        grid[index][6] = index % 2 == 0
    grid[size - 8][8] = True

    positions = [(8, i) for i in range(6)] + [(8, 7), (8, 8), (7, 8)] + [(i, 8) for i in range(5, -1, -1)]
    for bit, (row, col) in zip(FORMAT_L0, positions, strict=True):
        grid[row][col] = bit == "1"
    copy = [(size - 1 - i, 8) for i in range(8)] + [(8, size - 7 + i) for i in range(7)]
    for bit, (row, col) in zip(FORMAT_L0, copy, strict=True):
        grid[row][col] = bit == "1"

    bitstream = []
    for word in stream:
        for shift in range(7, -1, -1):
            bitstream.append((word >> shift) & 1)
    bit_i = 0
    upward = True
    col = size - 1
    while col > 0:
        if col == 6:
            col -= 1
        for step in range(size):
            row = size - 1 - step if upward else step
            for offset in (0, 1):
                cc = col - offset
                if grid[row][cc] is not None:
                    continue
                dark = bitstream[bit_i] == 1 if bit_i < len(bitstream) else False
                bit_i += 1
                if (row + cc) % 2 == 0:
                    dark = not dark
                grid[row][cc] = dark
        upward = not upward
        col -= 2
    return [[cell is True for cell in row] for row in grid]


def matrix_to_ascii(matrix: list[list[bool]]) -> str:
    blank = [False, False, *[False] * len(matrix[0]), False, False]
    rows = [blank, blank]
    for row in matrix:
        rows.append([False, False, *row, False, False])
    rows.extend([blank, blank])
    return "\n".join("".join("██" if cell else "  " for cell in row) for row in rows)


def matrix_to_svg(matrix: list[list[bool]], module: int = 4) -> str:
    """Crisp-edge SVG for the host QR page and dashboard tab."""
    size = len(matrix)
    pad = 2
    dim = (size + pad * 2) * module
    cells: list[str] = []
    for row_index, row in enumerate(matrix):
        for col_index, dark in enumerate(row):
            if not dark:
                continue
            cells.append(
                f'<rect x="{(col_index + pad) * module}" y="{(row_index + pad) * module}" '
                f'width="{module}" height="{module}"/>'
            )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {dim} {dim}" '
        f'width="{dim}" height="{dim}" shape-rendering="crispEdges" fill="#170d02">'
        f'<rect width="{dim}" height="{dim}" fill="#e8f2fd"/>'
        f"{''.join(cells)}</svg>"
    )
