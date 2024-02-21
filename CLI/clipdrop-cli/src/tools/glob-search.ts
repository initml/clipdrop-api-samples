import * as glob from 'glob'

export default async function globSearch(pattern: string) {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, files) => {
      if (err) reject(err)
      else resolve(files)
    })
  })
}
