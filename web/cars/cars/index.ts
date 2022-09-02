type Cars = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const CARS_ENDPOINT :any = process.env.NEXT_PUBLIC_CARS_ENDPOINT

export async function cars(file: File): Promise<Cars> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }

      // basic template parameters
      const data = new FormData();
      data.append('image_file', file);
      data.append('upscale', 'false');
      data.append('add_shadow', 'true');
      data.append('add_watermark', 'true');
      data.append('mode', 'cover');
      data.append('width', '1280');
      data.append('height', '720');
  
      const res = await fetch(CARS_ENDPOINT, {
        method: 'POST',
        body: data,
      })
      
      if (!res.ok) {
        throw new Error('Error with clipdrop-car service')
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

    } catch (e) {
      console.error('error in cars service', e)
      reject(e)
    }
  })
}
