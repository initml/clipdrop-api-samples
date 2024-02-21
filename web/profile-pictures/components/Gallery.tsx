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
  const onClickHandler = (choice: string): void => {
    choiceSelection(choice)
  }

  return (
    <div className="grid grid-cols-3 gap-3 ">
      {choices.map((choice: string, index: number): JSX.Element => {
        return (
          <Image
            key={index}
            onClick={(): void => {
              onClickHandler(choice)
            }}
            className={'cursor-pointer'}
            width={200}
            height={200}
            src={'profile-picture/templates/' + choice + '.png'}
            alt={`Preview of template ${choice}`}
          ></Image>
        )
      })}
    </div>
  )
}

export default Gallery
