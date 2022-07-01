import {expect, test} from '@oclif/test'

describe('register-api-key', () => {
  test
  .stdout()
  .command(['register-api-key'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['register-api-key', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
