import NextImage, { ImageProps } from 'next/image'
import type { ImageLoaderProps } from 'next/image'
import * as React from 'react'

export function imageUri(name: string) {
  return `https://static.clipdrop.co/web/${name}`
}

export function cdnLoader(props: ImageLoaderProps) {
  return imageUri(props.src)
}

export default function Image(props: ImageProps) {
  return (
    <div>
      <NextImage loader={cdnLoader} {...props} />
    </div>
  )
}
