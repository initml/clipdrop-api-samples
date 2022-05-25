type Cleanup = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const VISION_API_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.NEXT_PUBLIC_VISION_API_KEY}`
const CLEANUP_API_ENDPOINT = 'https://apis.clipdrop.co/cleanup/v1'

const getBase64 = async function (file: File) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function () {
      const result = reader.result?.toString()
      if (!result) {
        reject('could not split')
        return
      }
      const [, base64] = result.split(';base64,')
      resolve(base64)
    }
    reader.onerror = function (error) {
      console.error('Error: ', error)
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

export async function removeText(file: File, apiKey: string): Promise<Cleanup> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }

      // text detection
      const base64File = await getBase64(file)
      // Text detection in the item
      const detection = await fetch(VISION_API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64File,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                },
              ],
            },
          ],
        }),
      })
      if (!detection.ok) {
        throw new Error('could not call text detection API')
      }
      const jsonResponse = await detection.json()

      const response = jsonResponse.responses[0]
      const page = response?.fullTextAnnotation?.pages[0]
      if (!page) {
        throw new Error('no text found')
      }
      const boxes = page.blocks
        .map((b: any) => b.paragraphs.map((p: any) => p.boundingBox.vertices))
        .flat()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const [width, height] = await getImageSize(file)

      canvas.width = width
      canvas.height = height
      if (ctx) {
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = 'white'
        for (let box of boxes) {
          const x = box[0].x
          const y = box[0].y
          const width = box[2].x - x
          const height = box[2].y - y
          const newWidth = width * 1.5
          const newHeight = height * 1.5
          const newX = x - Math.round((newWidth - width) / 2)
          const newY = y - Math.round((newHeight - height) / 2)

          const expanded = {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          }
          ctx.fillRect(expanded.x, expanded.y, expanded.width, expanded.height)
        }

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
    } catch (e) {
      console.error('error in remove text', e)
      reject(e)
    }
  })
}
