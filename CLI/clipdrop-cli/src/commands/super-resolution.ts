import { Command, Flags, CliUx } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as FormData from 'form-data'
import * as mime from 'mime-types'

import { FUNCTION_SUPER_RESOLUTION, STORE_API_KEY } from '../constants'
import { get } from '../tools/store'
import extendFileName from '../tools/extend-file-name'
import queryImages from '../tools/query-images'

export default class SuperResolution extends Command {
  static description = 'Upscale the resolution of a picture'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({
      char: 'i',
      description:
        'Image to process can be glob pattern like "/path/to/image/*.jpg"',
      required: true,
      multiple: true,
    }),
    scale: Flags.enum({
      options: ['2', '4'],
      char: 's',
      description: 'Scale applied to your picture',
      default: '2',
    }),
    folder: Flags.string({
      char: 'f',
      description:
        'Result destination folder, can be useFull with multi process',
      exclusive: ['output'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'Result destination',
      multiple: true,
      exclusive: ['folder'],
    }),
  }

  static args = []

  public async run(): Promise<void> {
    const { flags } = await this.parse(SuperResolution)
    const key = get(STORE_API_KEY)
    if (typeof key !== 'string') {
      throw new TypeError('No API key configured')
    }

    const uniqueImages = await queryImages(flags.image)

    this.log('images to process', uniqueImages)
    this.log('\n\n')
    CliUx.ux.action.start('processing')

    for (const [index, image] of uniqueImages.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await this.process(key, {
        image,
        scale: flags.scale,
        output: flags.output?.[index],
        folder: flags.folder,
      })
    }

    CliUx.ux.action.stop()
  }

  public async process(
    key: string,
    {
      image,
      scale,
      output: cliOutput,
      folder,
    }: {
      image: string
      scale: string
      output?: string
      folder?: string
    },
  ): Promise<void> {
    this.log(`Processing super resolution for : ${image}`)

    const paths = image.split('/')
    const filename = paths[paths.length - 1]
    const file = await fs.readFile(image)

    const data = new FormData()
    data.append('image_file', file, {
      contentType: mime.lookup(image) || undefined,
      filename,
    })
    data.append('upscale', scale)

    try {
      const result = await axios.post(FUNCTION_SUPER_RESOLUTION, data, {
        headers: {
          'x-api-key': key,
        },
        responseType: 'arraybuffer',
      })

      const selectedOutput = folder ? `${folder}/${filename}` : cliOutput
      const defaultOutput = extendFileName(image, `-super-resolution-x${scale}`)
      const output = selectedOutput ?? defaultOutput

      const dirName = path.dirname(output)
      if (!existsSync(dirName)) {
        await fs.mkdir(dirName, { recursive: true })
      }

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
