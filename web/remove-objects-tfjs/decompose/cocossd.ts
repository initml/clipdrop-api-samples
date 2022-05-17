import * as cocoSSD from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'

const cococlasses = require('@tensorflow-models/coco-ssd/dist/classes')

const DILATE_FACTOR = 1.25

let net: cocoSSD.ObjectDetection
cocoSSD.load({ base: 'mobilenet_v2' }).then((n) => {
  console.log('model loaded')
  net = n
})

export const cocoSSDClasses = Object.values(cococlasses.CLASSES).map(
  (v) => (v as any).displayName
)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface CocoSSDResult {
  class: string
  foreground: HTMLCanvasElement
  mask: HTMLCanvasElement
}

function createClassCanvases(
  image: HTMLCanvasElement,
  detections: cocoSSD.DetectedObject[]
) {
  const foreground = document.createElement('canvas')
  const foregroundCtx = foreground.getContext('2d')
  const mask = document.createElement('canvas')
  const maskCtx = mask.getContext('2d')
  if (!foregroundCtx || !maskCtx) {
    throw new Error('No context')
  }
  foreground.width = mask.width = image.width
  foreground.height = mask.height = image.height
  maskCtx.fillStyle = 'black'
  maskCtx.fillRect(0, 0, image.width, image.height)
  for (const d of detections) {
    let [x, y, width, height] = d.bbox
    x -= width * (DILATE_FACTOR - 1) * 0.5
    y -= height * (DILATE_FACTOR - 1) * 0.5
    width *= DILATE_FACTOR
    height *= DILATE_FACTOR
    maskCtx.fillStyle = 'white'
    maskCtx.fillRect(x, y, width, height)
    foregroundCtx.drawImage(image, x, y, width, height, x, y, width, height)
    foregroundCtx.strokeStyle = 'red'
    foregroundCtx.rect(x, y, width, height)
  }
  return { foreground, mask }
}

export default async function cocossd(
  image: HTMLCanvasElement
): Promise<CocoSSDResult[]> {
  if (!net) {
    await sleep(1000)
    return cocossd(image)
  }

  const detection = await net.detect(image)

  const results: CocoSSDResult[] = []
  const detectedClasses = Array.from(new Set(detection?.map((r) => r.class)))
  for (const c of detectedClasses) {
    // Retrieve all the detections from that class
    const classDetections = detection.filter((d) => d.class === c)
    const { foreground, mask } = createClassCanvases(image, classDetections)
    results.push({
      class: c,
      foreground,
      mask,
    })
  }
  console.log(detectedClasses)
  return results
}
