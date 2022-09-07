import React, { useEffect, useState } from 'react'
import Image from './Image'

type GalleryProps = {
  choices: string[]
  choiceSelection: Function
}

const Gallery: React.FC<GalleryProps> = ({
  choices,
  choiceSelection,
}: GalleryProps): JSX.Element => {
  const [selection, setSelection] = useState<string | undefined>(undefined)

  const handleClick = (choice: string): void => {
    choiceSelection(choice)
    setSelection(choice)
  }

  return (
    <>
      <div className="gallery">
        {choices.map((choice: string, index: number): JSX.Element => {
          return (
            <p
              key={index}
              style={{
                backgroundColor: choice == selection ? '#0062cc' : 'white',
              }}
              onClick={(): void => {
                handleClick(choice)
              }}
            >
              <Image
                width={100}
                height={100}
                src={'profile-picture/templates/' + choice + '.png'}
                alt={`Preview of template ${choice}`}
              ></Image>
            </p>
          )
        })}
      </div>
    </>
  )
}

export default Gallery
