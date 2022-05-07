import { dataURItoBlob, getImage } from "./utils"

interface ResizeImageFileResult {
  file: File
  resized: boolean
  originalWidth: number
  originalHeight: number
}
export async function resizeImageFile(
  file: File,
  maxSize: number,
): Promise<ResizeImageFileResult> {
  const image = await getImage(file)
  const canvas = document.createElement('canvas')

  let { width, height } = image

  if (width > height) {
    if (width > maxSize) {
      height *= maxSize / width
      width = maxSize
    }
  } else if (height > maxSize) {
    width *= maxSize / height
    height = maxSize
  }

  if (width === image.width && height === image.height) {
    return {
      file,
      resized: false,
      originalWidth: image.width,
      originalHeight: image.height,
    }
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('could not get context')
  }
  canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg')
  const blob = dataURItoBlob(dataUrl)
  const f = new File([blob], file.name, {
    type: file.type,
  })
  return {
    file: f,
    resized: true,
    originalWidth: image.width,
    originalHeight: image.height,
  }
}