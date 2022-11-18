import * as automl from '@tensorflow/tfjs-automl'
import * as tf from '@tensorflow/tfjs'
import { dispose, image } from '@tensorflow/tfjs-core'

type Cleanup = {
  base64: string
}

const MODEL_URL = '/logo-detection/model.json'
if (typeof window !== 'undefined') {
  automl.loadImageClassification(MODEL_URL).then((model) => {
    // @ts-ignore
    window.logoDetector = model
    console.log('model loaded')
  })
}

/** Contains the coordinates of a bounding box. */
export interface Box {
  /** Number of pixels from the top of the image (top padding). */
  top: number
  /** Number of pixels from the left of the image (left padding). */
  left: number
  /** The width of the box. */
  width: number
  /** The height of the box. */
  height: number
}

/** The predicted object, which holds the score, label and bounding box. */
export interface PredictedObject {
  box: Box
  score: number
  label: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const CLEANUP_API_ENDPOINT = 'https://clipdrop-api.co/cleanup/v1'

const getImage = async function (file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function () {
      const result = reader.result?.toString()
      if (!result) {
        reject('could not split')
        return
      }
      const image = new Image()
      image.onload = function (e: any) {
        resolve(image)
      }
      image.src = result
    }
    reader.onerror = function (error) {
      reject(error)
    }
  })
}

const getImageSize = async function (file: File): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function () {
      const result = reader.result?.toString()
      if (!result) {
        reject('could not split')
        return
      }
      const image = new Image()
      image.onload = function (e: any) {
        resolve([e.path[0].naturalWidth, e.path[0].naturalHeight])
      }
      image.src = result
    }
    reader.onerror = function (error) {
      reject(error)
    }
  })
}

function calculateMostLikelyLabels(
  scores: Float32Array,
  numBoxes: number,
  numClasses: number
): { boxScores: number[]; boxLabels: number[] } {
  // Holds a score for each box.
  const boxScores: number[] = []
  // Holds the label id for each box.
  const boxLabels: number[] = []
  for (let i = 0; i < numBoxes; i++) {
    let maxScore = Number.MIN_VALUE
    let mostLikelyLabel = -1
    for (let j = 0; j < numClasses; j++) {
      const flatIndex = i * numClasses + j
      const score = scores[flatIndex]
      if (score > maxScore) {
        maxScore = scores[flatIndex]
        mostLikelyLabel = j
      }
    }
    boxScores[i] = maxScore
    boxLabels[i] = mostLikelyLabel
  }
  return { boxScores, boxLabels }
}

function buildDetectedObjects(
  width: number,
  height: number,
  boxes: Float32Array,
  boxScores: number[],
  boxLabels: number[],
  selectedBoxes: Int32Array,
  dictionary: string[]
): PredictedObject[] {
  const objects: PredictedObject[] = []
  // Each 2d rectangle is fully described with 4 coordinates.
  const numBoxCoords = 4
  for (let i = 0; i < selectedBoxes.length; i++) {
    const boxIndex = selectedBoxes[i]
    const [top, left, bottom, right] = Array.from(
      boxes.slice(
        boxIndex * numBoxCoords,
        boxIndex * numBoxCoords + numBoxCoords
      )
    )
    objects.push({
      box: {
        left: left * width,
        top: top * height,
        width: (right - left) * width,
        height: (bottom - top) * height,
      },
      label: dictionary[boxLabels[boxIndex]],
      score: boxScores[boxIndex],
    })
  }
  return objects
}

export async function removeLogo(file: File, apiKey: string): Promise<Cleanup> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }

      // // object detection
      // // Load the model.
      // // @ts-ignore

      const img = await getImage(file)
      const [width, height] = [img.naturalWidth, img.naturalHeight]

      const OUTPUT_NODE_NAMES = [
        'Postprocessor/convert_scores',
        'Postprocessor/Decode/transpose_1',
      ]

      const tfImg = tf.expandDims(tf.browser.fromPixels(img).toFloat())
      const [scoresTensor, boxesTensor] =
        // @ts-ignore
        (await window.logoDetector.graphModel.executeAsync(
          tfImg,
          OUTPUT_NODE_NAMES
        )) as tf.Tensor[]

      const [, numBoxes, numClasses] = scoresTensor.shape

      const [scores, boxes] = await Promise.all([
        scoresTensor.data(),
        boxesTensor.data(),
      ])

      const { boxScores, boxLabels } = calculateMostLikelyLabels(
        scores as Float32Array,
        numBoxes,
        numClasses
      )

      // Sort the boxes by score, ignoring overlapping boxes.
      const selectedBoxesTensor = await image.nonMaxSuppressionAsync(
        boxesTensor as tf.Tensor2D,
        boxScores,
        20,
        0.5,
        0.1
      )

      const selectedBoxes = (await selectedBoxesTensor.data()) as Int32Array
      dispose([tfImg, scoresTensor, boxesTensor, selectedBoxesTensor])

      const predictions = buildDetectedObjects(
        width,
        height,
        boxes as Float32Array,
        boxScores,
        boxLabels,
        selectedBoxes,
        ['background', 'logo']
      )

      let bboxes = predictions.map((p: any) => p.box)
      console.log(bboxes)

      // only keep the first one
      bboxes = bboxes.slice(0, 1)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = width
      canvas.height = height
      if (ctx) {
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = 'white'
        for (let box of bboxes) {
          console.log(box)
          const x = box.left
          const y = box.top
          const width = box.width
          const height = box.height
          const newWidth = width * 1.15
          const newHeight = height * 1.15
          const newX = x - Math.round((newWidth - width) / 2)
          const newY = y - Math.round((newHeight - height) / 2)
          console.log(x, y, width, height)

          const expanded = {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          }
          ctx.fillRect(expanded.x, expanded.y, expanded.width, expanded.height)
        }
        img?.parentNode?.appendChild(canvas)

        // Send to cleanup API
        canvas.toBlob(async (b: Blob | null) => {
          try {
            if (!b) {
              throw new Error('could not convert canvas to blob')
            }
            const mask = new File([b], 'mask.png', {
              type: 'image/png',
            })
            const data = new FormData()
            data.append('image_file', file)
            data.append('mask_file', mask)

            const res = await fetch(CLEANUP_API_ENDPOINT, {
              method: 'POST',
              body: data,
              headers: {
                'x-api-key': apiKey,
              },
            })
            if (!res.ok) {
              throw await res.json()
            }

            const resultArrayBuffer = await res.arrayBuffer()
            const resultFile = new File([resultArrayBuffer], 'result.png', {
              type: 'image/png',
            })
            const reader = new FileReader()
            reader.addEventListener(
              'load',
              function () {
                if (!reader.result) {
                  return
                }
                resolve({
                  base64: reader.result.toString(),
                })
              },
              false
            )
            reader.readAsDataURL(resultFile)
          } catch (error) {
            reject(error)
          }
        })
      }
      img.src = URL.createObjectURL(file)
    } catch (e) {
      console.error('error in remove text', e)
      reject(e)
    }
  })
}
