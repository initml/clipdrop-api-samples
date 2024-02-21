import { Command } from '@oclif/core'
import { STORE_API_KEY } from '../constants'
import { set } from '../tools/store'

export default class RegisterApiKey extends Command {
  static description = 'Register the ClipDrop API key'

  static examples = ['<%= config.bin %> <%= command.id %> <key>']

  static flags = {}

  static args = [
    { name: 'key', description: 'API token to register', required: true },
  ]

  public async run(): Promise<void> {
    const { args } = await this.parse(RegisterApiKey)

    set(STORE_API_KEY, args.key)

    this.log('API key successfully registered')
  }
}
