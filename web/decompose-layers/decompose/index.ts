import { dilate } from './dilate'
import { resizeImageFile } from './resize'
import { blobToCanvas, canvasToBlob } from './utils'

const CLEANUP_ENDPOINT = `https://clipdrop-api.co/cleanup/v1`
const REMOVE_BACKGROUND_ENDPOINT = `https://clipdrop-api.co/remove-background/v1`

const HD_MAX_SIZE = 4000
const SD_MASK_SIZE = 1000
const DILATE_HD = 30
const DILATE_SD = 20

export default async function decompose(
  originalFile: File,
  apiKey: string,
  hd?: boolean
): Promise<{ background: HTMLCanvasElement; foreground: HTMLCanvasElement }> {
  // Downscale the image to make the processing faster
  const { file } = await resizeImageFile(
    originalFile,
    hd ? HD_MAX_SIZE : SD_MASK_SIZE
  )

  // Get a mask of the main element
  const payload = new FormData()
  payload.append('image_file', file)
  payload.append('outputs[]', 'mask')
  const response = await fetch(REMOVE_BACKGROUND_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'image/png',
      'x-api-key': apiKey,
    },
    body: payload,
  })
  if (!response.ok) {
    throw await response.json()
  }
  const maskedBlob = await response.blob()
  const foreground = await blobToCanvas(maskedBlob)

  // // Dilate the mask
  const maskCanvas = await blobToCanvas(maskedBlob)
  const maskCtx = maskCanvas.getContext('2d')
  if (!maskCtx) {
    throw new Error('No mask context')
  }
  dilate(maskCtx, hd ? DILATE_HD : DILATE_SD)
  const expandedMaskBlob = await canvasToBlob(maskCanvas)
  if (!expandedMaskBlob) {
    throw new Error('No expanded mask')
  }

  // Cleanup the background
  const cleanupPayload = new FormData()
  const maskFile = new File([expandedMaskBlob], 'mask.png', {
    type: 'image/png',
  })
  cleanupPayload.append('image_file', file)
  cleanupPayload.append('mask_file', maskFile)
  const cleanupResponse = await fetch(CLEANUP_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'image/png',
      'x-api-key': apiKey,
    },
    body: cleanupPayload,
  })
  if (!cleanupResponse.ok) {
    throw await cleanupResponse.text()
  }
  const backgroundBlob = await cleanupResponse.blob()
  const background = await blobToCanvas(backgroundBlob)

  return { background, foreground }
}
