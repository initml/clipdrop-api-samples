type ProfilePictures = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false
const PROFILE_PICTURES_ENDPOINT :any = process.env.NEXT_PUBLIC_PROFILE_PICTURES_ENDPOINT

export async function profile_pictures(file: File, template:string , background_color:string ): Promise<ProfilePictures> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return file
      }

      // basic template parameters
      const data = new FormData();
      data.append('image_files', file);
      data.append('template', template);
      data.append('background_color', background_color);
      data.append('output_width', '512');
      data.append('output_height', '512');

      const res = await fetch(PROFILE_PICTURES_ENDPOINT, {
        method: 'POST',
        body: data,
      })
      
      if (!res.ok) {
        throw new Error('Error with profile pictures service')
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
      console.error('error in profile pictures service', e)
      reject(e)
    }
  })
}
