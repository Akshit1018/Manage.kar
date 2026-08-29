import { compactPairPayload, type ManagekarPairTicket } from "@/lib/hermes/plugin-pair"
import { encodeQrMatrix } from "@/lib/hermes/qr-byte"

export function PairQr({ ticket, moduleSize = 5 }: { ticket: ManagekarPairTicket; moduleSize?: number }) {
  const matrix = encodeQrMatrix(compactPairPayload(ticket))
  return (
    <div
      role="img"
      aria-label="Host pairing QR"
      className="mk-pairing-qr mx-auto"
      style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))`, width: matrix.length * moduleSize }}
    >
      {matrix.flatMap((row, y) =>
        row.map((on, x) => (
          <span
            key={`${y}-${x}`}
            className={on ? "bg-foreground" : "bg-transparent"}
            style={{ width: moduleSize, height: moduleSize }}
          />
        )),
      )}
    </div>
  )
}
