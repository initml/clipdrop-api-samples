import Conf from 'conf'

const config = new Conf()

export function set(name: string, value: string) {
  config.set(name, value)
}

export function get(name: string) {
  return config.get(name)
}
