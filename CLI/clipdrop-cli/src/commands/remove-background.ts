import { Command, Flags, CliUx } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import * as fs from 'node:fs/promises'
import * as FormData from 'form-data'
import * as mime from 'mime-types'

import { FUNCTION_REMOVE_BACKGROUND, STORE_API_KEY } from '../constants'
import { get } from '../tools/store'
import extendFileName from '../tools/extend-file-name'

export default class RemoveBackground extends Command {
  static description = 'Remove the background of a picture'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({
      char: 'i',
      description: 'Image to process',
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Result destination',
    }),
  }

  static args = []

  public async run(): Promise<void> {
    const { flags } = await this.parse(RemoveBackground)
    const key = get(STORE_API_KEY)
    if (typeof key !== 'string') {
      throw new TypeError('No API key configured')
    }

    CliUx.ux.action.start(`Processing remove background for : ${flags.image}`)

    const paths = flags.image.split('/')
    const filename = paths[paths.length - 1]
    const file = await fs.readFile(flags.image)

    const data = new FormData()
    data.append('image_file', file, {
      contentType: mime.lookup(flags.image) || undefined,
      filename,
    })

    try {
      const result = await axios.post(FUNCTION_REMOVE_BACKGROUND, data, {
        headers: {
          'x-api-key': key,
        },
        responseType: 'arraybuffer',
      })

      CliUx.ux.action.stop()

      const output =
        flags.output || extendFileName(flags.image, '-remove-background')

      await fs.writeFile(output, result.data)
      this.log('\n\nFile written at : ', output)
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
