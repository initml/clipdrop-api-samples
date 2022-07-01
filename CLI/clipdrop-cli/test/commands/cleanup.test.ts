import {expect, test} from '@oclif/test'

describe('cleanup', () => {
  test
  .stdout()
  .command(['cleanup'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['cleanup', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
