const SEL = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'

// Keeps Tab inside `root`, focuses its first control, returns a release() that restores prior focus.
const stack = []

export function trapFocus(root) {
  const prev = document.activeElement
  const items = () => [...root.querySelectorAll(SEL)].filter((el) => getComputedStyle(el).visibility !== 'hidden')
  const onKey = (e) => {
    if (e.key !== 'Tab' || stack[stack.length - 1] !== root) return
    const list = items()
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); return }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  stack.push(root)
  document.addEventListener('keydown', onKey)
  setTimeout(() => items()[0]?.focus({ preventScroll: true }), 0)
  return () => {
    document.removeEventListener('keydown', onKey)
    const i = stack.lastIndexOf(root)
    if (i >= 0) stack.splice(i, 1)
    if (prev && prev.isConnected) prev.focus({ preventScroll: true })
  }
}
