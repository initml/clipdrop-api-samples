type Cleanup = {
  base64: string
}

/** Contains the coordinates of a bounding box. */
interface Box {
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
interface PredictedObject {
  box: Box
  score: number
  label: string
}

// An object to configure parameters to set for the bodypix model.
// See github docs for explanations.
const bodyPixProperties = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4,
}

// An object to configure parameters for detection. I have raised
// the segmentation threshold to 90% confidence to reduce the
// number of false positives.
const segmentationProperties = {
  flipHorizontal: false,
  internalResolution: 'high',
  segmentationThreshold: 0.9,
  scoreThreshold: 0.2,
}

var model = undefined

// @ts-ignore
function processSegmentations(segmentations) {
  for (let segmentation of segmentations) {
    processSegmentation(segmentation)
  }
}

// @ts-ignore
function processSegmentation(segmentation) {
  // Lets create a canvas to render our findings.
  var canvas = document.createElement('canvas')
  canvas.width = segmentation.width
  canvas.height = segmentation.height

  var ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.filter = 'blur(50px)'

  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let data = imageData.data

  // first round to store x,y of values that would be white in the mask
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (segmentation.data[n] !== 0) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = 255
    } else {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
    n++
  }

  ctx.putImageData(imageData, 0, 0)
  console.log(typeof document)
  if (typeof document !== 'undefined') {
    // Client-side-only code
    console.log('append canvas')
    const doc = document as Document
    const container = doc.getElementById('result-container')
    if (container) {
      canvas.setAttribute(
        'class',
        'pointer-events-none  absolute top-0 left-0 max-h-[calc(100vh-450px)] rounded-md transition-all duration-700 border border-opacity-20'
      )
      canvas.setAttribute('style', 'opacity:0.25')

      container.appendChild(canvas)
      console.log('added')
    }
  }
}

const interval = setInterval(() => {
  if (typeof window === 'undefined') {
    clearInterval(interval)
    return
    // Client-side-only code
  }
  // @ts-ignore
  if (window && window.bodyPix) {
    clearInterval(interval)
    console.log('ready')
    // @ts-ignore
    model = window.bodyPix.load(bodyPixProperties).then(function (loadedModel) {
      model = loadedModel
      // Show demo section now model is ready to use.
      console.log('loaded')
    })
  }
}, 100)

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const CLEANUP_API_ENDPOINT = 'https://apis.clipdrop.co/cleanup/v1'

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

export async function removePerson(
  file: File,
  imageData: ImageData,
  apiKey: string
): Promise<Cleanup> {
  return new Promise(async (resolve, reject) => {
    try {
      var canvas = document.createElement('canvas')
      const [width, height] = await getImageSize(file)
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      ctx.putImageData(imageData, 0, 0)
      document.body.appendChild(canvas)
      return

      const canvas2 = document.createElement('canvas')
      canvas2.width = canvas.width
      canvas2.height = canvas.height
      const ctx2 = canvas.getContext('2d')
      if (!ctx2) {
        return
      }
      const max = Math.max(...[canvas.width, canvas.height])
      console.log({ max })
      console.log(max * 0.033)
      const blurFactor = Math.round(max * 0.015)
      const filter = `blur(${blurFactor}px)`
      console.log(filter)
      ctx2.filter = filter
      ctx2.drawImage(canvas, 0, 0)

      ctx.drawImage(canvas2, 0, 0)

      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = newImageData.data

      let n = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
          data[i + 3] = 255
        } else {
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 255
        }
        n++
      }

      ctx.putImageData(newImageData, 0, 0)

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

      // document.body.appendChild(canvas)
    } catch (error) {}
  })
}

export async function detectPersons(file: File): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await getImage(file)

      // @ts-ignore
      model
        .segmentMultiPerson(img, segmentationProperties)
        // @ts-ignore
        .then(function (segmentations) {
          processSegmentations(segmentations)
          resolve()
        })

      return
    } catch (e) {
      console.error('error in remove text', e)
      reject(e)
    }
  })
}
