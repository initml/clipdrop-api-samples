type Cars = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const CARS_ENDPOINT :any = process.env.CARS_ENDPOINT

export async function cars(file: File, apiKey: string): Promise<Cars> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }
      
      const data = new FormData()
      data.append('image_file', file)
      data.append('add_shadow', 'true')

      // -F 'mode=' \
      // -F 'margin_top=0.15' \
      // -F 'plate_file=' \
      // -F 'width=' \
      // -F 'height=' \
      // -F 'margin_right=0.15' \
      // -F 'background_file=' \
      // -F 'upscale=true' \
      // -F 'watermark_file=' \
      // -F 'margin_left=0.15' \
      // -F 'margin_bottom=0.15' \
      // -F 'add_shadow=true'

      const res = await fetch(CARS_ENDPOINT, {
        method: 'POST',
        body: data,

      })
      console.log(res.status)
      console.log(res)
      
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

    } catch (e) {
      console.error('error in cars service', e)
      reject(e)
    }
  })
}
