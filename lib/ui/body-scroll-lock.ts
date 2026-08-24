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

export function lockBodyScroll(doc: ScrollLockDocument, scrollY: number): ScrollLockHandle {
  if (doc.body.dataset[LOCK_FLAG] === "1") {
    return {
      scrollY: Number.parseInt(doc.body.style.top?.replace("-", "") || "0", 10) || scrollY,
      bodyOverflow: "",
      bodyPosition: "",
      bodyTop: "",
      bodyWidth: "",
      rootOverflow: "",
    }
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
  return handle
}

export function unlockBodyScroll(doc: ScrollLockDocument, handle: ScrollLockHandle): number {
  if (doc.body.dataset[LOCK_FLAG] !== "1") {
    return handle.scrollY
  }

  doc.body.style.overflow = handle.bodyOverflow
  doc.body.style.position = handle.bodyPosition
  doc.body.style.top = handle.bodyTop
  doc.body.style.width = handle.bodyWidth
  doc.documentElement.style.overflow = handle.rootOverflow
  delete doc.body.dataset[LOCK_FLAG]
  return handle.scrollY
}
