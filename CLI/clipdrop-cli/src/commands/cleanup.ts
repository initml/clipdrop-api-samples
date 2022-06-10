import { CliUx, Command, Flags } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as FormData from 'form-data'
import * as mime from 'mime-types'
import * as path from 'node:path'
import { createCanvas } from 'canvas'

import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs-node'
import type { Tensor3D } from '@tensorflow/tfjs'

import { FUNCTION_CLEANUP, STORE_API_KEY } from '../constants'
import { get } from '../tools/store'
import extendFileName from '../tools/extend-file-name'
import queryImages from '../tools/query-images'

export default class Cleanup extends Command {
  static description = 'Remove objects on a picture'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({
      char: 'i',
      description:
        'Image to process can be glob pattern like "/path/to/image/*.jpg"',
      required: true,
      multiple: true,
    }),
    object: Flags.string({
      description:
        '[required for batch] object to remove in all pictures, detected with cocoSsd model. Use "*" to remove all detected objects',
      multiple: true,
    }),
    mask: Flags.string({
      char: 'm',
      description: 'Related mask',
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
    const { flags } = await this.parse(Cleanup)
    const key = get(STORE_API_KEY)
    if (typeof key !== 'string') {
      throw new TypeError('No API key configured')
    }

    const objects = flags?.object?.length ?? 0

    if (!flags.mask && objects === 0) {
      throw new TypeError('Specify one of --mask or --object flag')
    }

    if (flags.image.length > 1 && objects === 0) {
      throw new TypeError('Specify --object flag when using multiple images')
    }

    const uniqueImages = await queryImages(flags.image)

    this.log('images to process', uniqueImages)
    this.log('\n\n')
    CliUx.ux.action.start('processing')

    for (const [index, image] of uniqueImages.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await this.process(key, {
        image,
        output: flags.output?.[index],
        object: flags.object,
        mask: flags.mask,
        folder: flags.folder,
      })
    }

    CliUx.ux.action.stop('processing')
  }

  public async maskFromArg(maskPath: string) {
    const maskPaths = maskPath.split('/')
    const maskName = maskPaths[maskPaths.length - 1]
    const mask = await fs.readFile(maskPath)

    return {
      contentType: mime.lookup(maskPath) || undefined,
      mask,
      maskName,
    }
  }

  public async createMaskForObject(file: Buffer, objects?: string[]) {
    const model = await cocoSsd.load()
    const imageData = tf.node.decodeImage(new Uint8Array(file), 3)
    const height = imageData.shape[0]
    const width = imageData.shape[1]

    const predictions = await model.detect(imageData as Tensor3D)
    this.log('detected objects : ', predictions.map(p => p.class).join(', '))

    const toRemove = predictions.filter(p => {
      if (!objects) return false
      if (objects.includes('*')) return true
      return objects.includes(p.class)
    })

    if (toRemove.length === 0) return null

    this.log('object to remove : ', toRemove.map(v => v.class).join(', '))

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    toRemove.forEach(({ bbox }) => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(bbox[0] - 10, bbox[1] - 10, bbox[2] + 20, bbox[3] + 20)
    })

    const mask = canvas.toBuffer('image/png')
    const contentType = 'image/png'

    return {
      contentType,
      mask,
      maskName: 'mask.png',
    }
  }

  public async process(
    key: string,
    {
      image,
      mask,
      object,
      output: cliOutput,
      folder,
    }: {
      image: string
      mask?: string
      object?: string[]
      output?: string
      folder?: string
    },
  ) {
    this.log(`Processing cleanup for : ${image}`)

    const paths = image.split('/')
    const filename = paths[paths.length - 1]
    const file = await fs.readFile(image)

    const data = new FormData()
    data.append('image_file', file, {
      contentType: mime.lookup(image) || undefined,
      filename,
    })

    const maskInfos = mask
      ? await this.maskFromArg(mask)
      : await this.createMaskForObject(file, object)

    if (!maskInfos) {
      this.log('No object to remove detected. Process stopped')
      return
    }

    data.append('mask_file', maskInfos.mask, {
      contentType: maskInfos.contentType,
      filename: maskInfos.maskName,
    })

    try {
      const result = await axios.post(FUNCTION_CLEANUP, data, {
        headers: {
          'x-api-key': key,
        },
        responseType: 'arraybuffer',
      })

      const selectedOutput = folder ? `${folder}/${filename}` : cliOutput
      const defaultOutput = extendFileName(image, '-cleanup')
      const output = selectedOutput ?? defaultOutput

      const dirName = path.dirname(output)
      if (!existsSync(dirName)) {
        await fs.mkdir(dirName, { recursive: true })
      }

      await fs.writeFile(output, result.data)
      this.log('\n\nFile written at : ', output)
      this.log(`\n${result.headers['x-remaining-credits']} credits remain`)
    } catch (error) {
      if (error instanceof AxiosError) {
        this.log(`request fail with status code ${error.response?.status}`)
        this.error(error.response?.data?.toString('utf8'))
      } else {
        this.error(error as string)
      }
    }
  }
}
