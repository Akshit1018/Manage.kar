import { describe, expect, it } from "vitest"
import { lockBodyScroll, unlockBodyScroll, type ScrollLockDocument } from "./body-scroll-lock"

function mockDocument(): ScrollLockDocument {
  return {
    body: {
      style: {
        overflow: "",
        position: "",
        top: "",
        width: "",
      },
      dataset: {},
    },
    documentElement: {
      style: {
        overflow: "",
      },
    },
  }
}

describe("body scroll lock", () => {
  it("pins the document so a sheet cannot be revealed by scrolling the page", () => {
    const doc = mockDocument()
    const handle = lockBodyScroll(doc, 420)

    expect(doc.body.style.overflow).toBe("hidden")
    expect(doc.body.style.position).toBe("fixed")
    expect(doc.body.style.top).toBe("-420px")
    expect(doc.body.style.width).toBe("100%")
    expect(doc.documentElement.style.overflow).toBe("hidden")
    expect(doc.body.dataset.mkScrollLock).toBe("1")

    const restored = unlockBodyScroll(doc, handle)
    expect(restored).toBe(420)
    expect(doc.body.style.overflow).toBe("")
    expect(doc.body.style.position).toBe("")
    expect(doc.body.style.top).toBe("")
    expect(doc.body.dataset.mkScrollLock).toBeUndefined()
  })

  it("is idempotent when a lock is already held", () => {
    const doc = mockDocument()
    const first = lockBodyScroll(doc, 80)
    const second = lockBodyScroll(doc, 200)
    expect(second.scrollY).toBe(80)
    unlockBodyScroll(doc, first)
    expect(doc.body.style.position).toBe("")
  })
})
