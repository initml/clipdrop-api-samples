console.log('coucou')

onmessage = function (evt) {
  console.log('Message received from main script')

  const { pixels, width, height, channels, segmentation } = evt.data

  let pixelsImageData = new ImageData(
    new Uint8ClampedArray(pixels),
    width,
    height
  )

  let segmentationData = new Int32Array(segmentation)

  console.log('workerImageData', pixelsImageData)
  console.log('workerSegmentationData', segmentationData)

  let infos = []
  // first round to store x,y of values that would be white in the mask
  let n = 0
  for (let i = 0; i < pixelsImageData.data.length; i += 4) {
    if (segmentationData[n] !== -1) {
      const x = (i / 4) % width
      const y = ~~(i / 4 / width)
      infos.push({ x, y })
    }
    n++
  }
  console.log('workerInfos', infos.length)

  const data = pixelsImageData.data
  // second round to expand white area to surrounding pixels values that would be white in the mask
  let v = 0
  for (let j = 0; j < data.length; j += 4) {
    const x = (j / 4) % width
    const y = ~~(j / 4 / width)

    // const hypots = infos.map((pix) => {
    //   const xDiff = Math.abs(x - pix.x)
    //   const yDiff = Math.abs(y - pix.y)
    //   return Math.hypot(xDiff, yDiff)
    // })
    // console.log(Math.min.apply(Math, hypots))
    const shouldBeWhite = infos.some((pix) => {
      const xDiff = Math.abs(x - pix.x)
      const yDiff = Math.abs(y - pix.y)
      return Math.hypot(xDiff, yDiff) < 70
    })
    console.log(shouldBeWhite)
    if (false) {
    } else {
      data[j] = 0
      data[j + 1] = 0
      data[j + 2] = 0
      data[j + 3] = 255
    }
    v++
  }
  console.log('data', data)
  //   postMessage('','/', [])
  //   console.log('Posting message back to main script')
  //   postMessage(workerResult)
}
