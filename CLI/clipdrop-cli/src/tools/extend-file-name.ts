export default function extendFileName(path: string, extend: string) {
  const index = path.lastIndexOf('.')
  return `${path.slice(0, index)}${extend}${path.slice(index)}`
}
