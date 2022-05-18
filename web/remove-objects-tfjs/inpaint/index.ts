import { createResizedCanvas, resizeImageFile } from './resize'
import { blobToCanvas, canvasToBlob } from './utils'

const CLEANUP_ENDPOINT = `https://apis.clipdrop.co/cleanup/v1`

const HD_MAX_SIZE = 2048
const SD_MASK_SIZE = 720

export default async function inpainting(
  image: HTMLCanvasElement,
  mask: HTMLCanvasElement,
  apiKey: string,
  hd?: boolean
): Promise<HTMLCanvasElement> {
  // Downscale the image to make the processing faster
  const resized = createResizedCanvas(image, hd ? HD_MAX_SIZE : SD_MASK_SIZE)
  const resizedBlob = await canvasToBlob(resized)
  if (!resizedBlob) {
    throw new Error('Could not get resized image')
  }
  const file = new File([resizedBlob], 'mask.png', {
    type: 'image/png',
  })

  // Cleanup the background
  const payload = new FormData()
  const resizedMask = createResizedCanvas(mask, hd ? HD_MAX_SIZE : SD_MASK_SIZE)
  const maskBlob = await canvasToBlob(resizedMask)
  if (!maskBlob) {
    throw new Error('Could not get mask blob')
  }
  const maskFile = new File([maskBlob], 'mask.png', {
    type: 'image/png',
  })
  payload.append('image_file', file)
  payload.append('mask_file', maskFile)
  const cleanupResponse = await fetch(CLEANUP_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'image/png',
      'x-api-key': apiKey,
    },
    body: payload,
  })
  if (!cleanupResponse.ok) {
    throw await cleanupResponse.text()
  }
  const backgroundBlob = await cleanupResponse.blob()
  const result = await blobToCanvas(backgroundBlob)

  return result
}
