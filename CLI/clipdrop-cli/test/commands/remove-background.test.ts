import {expect, test} from '@oclif/test'

describe('remove-background', () => {
  test
  .stdout()
  .command(['remove-background'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['remove-background', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
