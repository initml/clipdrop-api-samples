import {expect, test} from '@oclif/test'

describe('super-resolution', () => {
  test
  .stdout()
  .command(['super-resolution'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['super-resolution', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
