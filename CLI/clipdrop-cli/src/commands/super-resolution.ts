import { Command, Flags, CliUx } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import * as fs from 'node:fs/promises'
import * as FormData from 'form-data'
import * as mime from 'mime-types'

import { FUNCTION_SUPER_RESOLUTION, STORE_API_KEY } from '../constants'
import { get } from '../tools/store'
import extendFileName from '../tools/extend-file-name'

export default class SuperResolution extends Command {
  static description = 'Upscale the resolution of a picture'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({
      char: 'i',
      description: 'Image to process',
      required: true,
    }),
    scale: Flags.enum({
      options: ['2', '4'],
      char: 's',
      description: 'Scale applied to your picture',
      default: '2',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Result destination',
    }),
  }

  static args = []

  public async run(): Promise<void> {
    const { flags } = await this.parse(SuperResolution)
    const key = get(STORE_API_KEY)
    if (typeof key !== 'string') {
      throw new TypeError('No API key configured')
    }

    CliUx.ux.action.start(`Processing super resolution for : ${flags.image}`)

    const paths = flags.image.split('/')
    const filename = paths[paths.length - 1]
    const file = await fs.readFile(flags.image)

    const data = new FormData()
    data.append('image_file', file, {
      contentType: mime.lookup(flags.image) || undefined,
      filename,
    })
    data.append('upscale', flags.scale)

    try {
      const result = await axios.post(FUNCTION_SUPER_RESOLUTION, data, {
        headers: {
          'x-api-key': key,
        },
        responseType: 'arraybuffer',
      })

      CliUx.ux.action.stop()

      const output =
        flags.output ||
        extendFileName(flags.image, `-super-resolution-x${flags.scale}`)

      await fs.writeFile(output, result.data)
      this.log(`\n\nFile written at : ${output}`)
      this.log(`\n${result.headers['x-remaining-credits']} credits remain`)
    } catch (error) {
      if (error instanceof AxiosError) {
        this.log(`request fail with status code ${error.response?.status}`)
        this.log(error.response?.data?.toString('utf8'))
      } else {
        this.error(error as string)
      }
    }
  }
}
