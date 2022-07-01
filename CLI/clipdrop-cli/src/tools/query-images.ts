import globSearch from './glob-search'
import unique from './unique'

export default async function queryImages(inputs: string[]) {
  const promises = inputs.map(async i => globSearch(i))
  const allPaths = await Promise.all(promises)
  const images = allPaths.flat()

  return unique(images as string[])
}
