import React, { useEffect, useState } from 'react';

type GalleryProps = {
  choices: string[];
  choiceSelection: Function;
};

const Gallery: React.FC<GalleryProps> = ({
  choices,
  choiceSelection,
}: GalleryProps): JSX.Element => {
  const onClickHandler = (choice: string): void => {
    choiceSelection(choice);
  };

  return (
    <>
      <div className='gallery'>
        {choices.map(
          (choice: string, index: number): JSX.Element => {
            return (
              <p
                key={index}
                onClick={(): void => {
                  onClickHandler(choice);
                }}
              >
                <img
                  src={"/thumbnails/" +  choice + ".png"}
                  alt={choice}
                >
                </img>
              </p>
            );
          }
        )}
      </div>
    </>
  );
};

export default Gallery;
