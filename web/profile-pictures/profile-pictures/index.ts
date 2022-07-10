type ProfilePicture = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const PROFILE_PICTURE_ENDPOINT = process.env.PROFILE_PICTURE_ENDPOINT

export async function profilePictures(file: File, apiKey: string): Promise<ProfilePicture> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }
      
      const data = new FormData()
      data.append('image_file', file)
      const res = await fetch(PROFILE_PICTURE_ENDPOINT, {
        method: 'POST',
        body: data,
        // headers: {
        //   'Access-Control-Allow-Origin': "*"
        // }
        // mode: 'no-cors'
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
      console.error('error in profile pictures', e)
      reject(e)
    }
  })
}
