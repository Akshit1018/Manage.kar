export interface ScrollLockStyles {
  overflow: string
  position?: string
  top?: string
  width?: string
}

export interface ScrollLockDocument {
  body: {
    style: ScrollLockStyles
    dataset: Record<string, string | undefined>
  }
  documentElement: {
    style: {
      overflow: string
    }
  }
}

export interface ScrollLockHandle {
  scrollY: number
  bodyOverflow: string
  bodyPosition: string
  bodyTop: string
  bodyWidth: string
  rootOverflow: string
}

const LOCK_FLAG = "mkScrollLock"
const LOCK_COUNT = "mkScrollLockCount"

const firstHandle = new WeakMap<ScrollLockDocument, ScrollLockHandle>()

export function lockBodyScroll(doc: ScrollLockDocument, scrollY: number): ScrollLockHandle {
  const existing = firstHandle.get(doc)
  if (existing && doc.body.dataset[LOCK_FLAG] === "1") {
    const next = Number(doc.body.dataset[LOCK_COUNT] ?? "1") + 1
    doc.body.dataset[LOCK_COUNT] = String(next)
    return existing
  }

  const handle: ScrollLockHandle = {
    scrollY,
    bodyOverflow: doc.body.style.overflow,
    bodyPosition: doc.body.style.position ?? "",
    bodyTop: doc.body.style.top ?? "",
    bodyWidth: doc.body.style.width ?? "",
    rootOverflow: doc.documentElement.style.overflow,
  }

  doc.body.style.overflow = "hidden"
  doc.body.style.position = "fixed"
  doc.body.style.top = `-${scrollY}px`
  doc.body.style.width = "100%"
  doc.documentElement.style.overflow = "hidden"
  doc.body.dataset[LOCK_FLAG] = "1"
  doc.body.dataset[LOCK_COUNT] = "1"
  firstHandle.set(doc, handle)
  return handle
}

export function unlockBodyScroll(doc: ScrollLockDocument, handle: ScrollLockHandle): number {
  if (doc.body.dataset[LOCK_FLAG] !== "1") {
    return handle.scrollY
  }

  const remaining = Number(doc.body.dataset[LOCK_COUNT] ?? "1") - 1
  if (remaining > 0) {
    doc.body.dataset[LOCK_COUNT] = String(remaining)
    return firstHandle.get(doc)?.scrollY ?? handle.scrollY
  }

  const original = firstHandle.get(doc) ?? handle
  doc.body.style.overflow = original.bodyOverflow
  doc.body.style.position = original.bodyPosition
  doc.body.style.top = original.bodyTop
  doc.body.style.width = original.bodyWidth
  doc.documentElement.style.overflow = original.rootOverflow
  delete doc.body.dataset[LOCK_FLAG]
  delete doc.body.dataset[LOCK_COUNT]
  firstHandle.delete(doc)
  return original.scrollY
}
