export function downloadBlob(base64: string, name: string) {
  const link = document.createElement('a')
  link.href = base64
  link.download = name

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    // window.URL.revokeObjectURL(base64)
    link.remove()
  }, 100)
}

export function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export const sleep = (t: number) =>
  new Promise(resolve => setTimeout(resolve, t))

const screens = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}
const sm = (val: number) => val >= screens.sm && val <= screens.md
const md = (val: number) => val >= screens.md && val <= screens.lg
const lg = (val: number) => val >= screens.lg && val <= screens.xl
const xl = (val: number) => val >= screens.xl

export const getBreakpoint = (w: number) => {
  if (sm(w)) return 'sm'
  else if (md(w)) return 'md'
  else if (lg(w)) return 'lg'
  else if (xl(w)) return 'xl'
  else return 'all'
}