

import { twMerge } from 'tailwind-merge'

export default function mergeClass(...classes: Array<string | false | null | undefined>) {
  return twMerge(...classes)
}