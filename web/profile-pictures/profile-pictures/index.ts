import { Templates, Colors, Effects, Geometries} from "./configuration";

type ProfilePictures = {
  base64: string
}

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false
const PROFILE_PICTURES_ENDPOINT :any = process.env.NEXT_PUBLIC_PROFILE_PICTURES_ENDPOINT

export async function profile_pictures(
  image_file: File,
  template:string | undefined = '',
  upscale:string | undefined = 'false',
  ): Promise<ProfilePictures> {
  return new Promise(async (resolve, reject) => {
    try {
      if (MOCK_API_CALL) {
        return image_file
      }

      // basic template parameters
      const data = new FormData();
      data.append('image_files', image_file);
      data.append('upscale', upscale ? upscale : 'false');
      data.append('output_width', '512');
      data.append('output_height', '512');

      console.log(template)
      if (template == Templates.TEMPLATE1) {
          data.append('template', Geometries.HEAD_INSIDE_CIRCLE);
          data.append('primary_color', Colors.SALMON);
          data.append('effect', Effects.INTENSE);
      }
      else if (template == Templates.TEMPLATE2) {
          data.append('template', Geometries.HEAD_OUTSIDE_CIRCLE);
          data.append('primary_color', Colors.ORANGE);
      }
      else if (template == Templates.TEMPLATE3) {
        data.append('template', Geometries.HEAD_INSIDE_SQUARE);
        data.append('primary_color', Colors.PINK);
        data.append('secondary_color', Colors.BLUEGREEN);
        data.append('effect', Effects.INTENSE)
      }
      else if (template == Templates.TEMPLATE4) {
        data.append('template', Geometries.HEAD_INSIDE_CIRCLE);
        data.append('primary_color', Colors.DARKRED);
        data.append('secondary_color', Colors.DARKBLUE);
        data.append('aura_color', Colors.LIGHTGRAY);
      }
      else if (template == Templates.TEMPLATE5) {
        data.append('template', Geometries.HALF_BODY);
        data.append('primary_color', Colors.WHITE);
        data.append('effect', Effects.GRAYSCALE);
      }
      else if (template == Templates.TEMPLATE6) {
        data.append('template', Geometries.HEAD_INSIDE_CIRCLE);
        data.append('effect', Effects.WINTER);
        data.append('keep_background', 'true')
      }
      else if (template == Templates.TEMPLATE7) {
        data.append('template', Geometries.CLOSE_UP);
        data.append('primary_color', Colors.WHITE);
        data.append('tint', 'true')
      }
      else if (template == Templates.TEMPLATE8) {
        data.append('template', Geometries.HEAD_INSIDE_CIRCLE);
        data.append('primary_color', Colors.LIGHTGREEN);
        data.append('effect', Effects.PENCIL);
      }
      else if (template == Templates.TEMPLATE9) {
        data.append('template', Geometries.HEAD_INSIDE_CIRCLE);
        data.append('primary_color', Colors.LIGHTGRAY);
        data.append('effect', Effects.STYLE_TRANSFER_HOKUSAI);
      }
      else {
        throw new Error('Undefined template')
      }
      
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
