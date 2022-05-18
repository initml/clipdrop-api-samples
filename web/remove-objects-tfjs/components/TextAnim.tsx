// A component that periodically changes the text of a text element with an animation
import { useCallback, useEffect, useState } from 'react'
import pluralize from 'pluralize'

interface TextAnimProps {
  texts: string[]
}

export default function TextAnim({ texts }: TextAnimProps) {
  const [current, setCurrent] = useState<string>()

  const randomize = useCallback(() => {
    const newText = texts[Math.floor(Math.random() * texts.length)]
    setCurrent(newText)
  }, [])

  useEffect(() => {
    randomize()
    const t = setInterval(randomize, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-transparent">
      {current}
    </span>
  )
}
