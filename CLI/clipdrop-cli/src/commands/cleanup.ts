import { Command, Flags } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import * as fs from 'node:fs/promises'
import * as FormData from 'form-data'
import * as mime from 'mime-types'

import { FUNCTION_CLEANUP, STORE_API_KEY } from '../constants'
import { get } from '../tools/store'

export default class Cleanup extends Command {
  static description = 'describe the command here'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({
      char: 'i',
      description: 'Image to process',
      required: true,
    }),
    mask: Flags.string({
      char: 'm',
      description: 'Related mask',
      required: true,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Result destination',
      required: true,
    }),
  }

  static args = []

  public async run(): Promise<void> {
    const { flags } = await this.parse(Cleanup)
    const key = get(STORE_API_KEY)
    if (typeof key !== 'string') {
      throw new TypeError('No API key configured')
    }

    this.log('Processing super resolution for : ', flags.image)

    const paths = flags.image.split('/')
    const filename = paths[paths.length - 1]
    const file = await fs.readFile(flags.image)

    const maskPaths = flags.image.split('/')
    const maskName = paths[maskPaths.length - 1]
    const mask = await fs.readFile(flags.mask)

    const data = new FormData()
    data.append('image_file', file, {
      contentType: mime.lookup(flags.image) || undefined,
      filename,
    })
    data.append('mask_file', mask, {
      contentType: mime.lookup(flags.mask) || undefined,
      filename: maskName,
    })

    try {
      const result = await axios.post(FUNCTION_CLEANUP, data, {
        headers: {
          'x-api-key': key,
        },
        responseType: 'arraybuffer',
      })

      await fs.writeFile(flags.output, result.data)
      this.log('File written at : ', flags.output)
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