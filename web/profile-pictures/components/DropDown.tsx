import React, { useEffect, useState } from 'react';

type DropDownProps = {
  choices: string[];
  showDropDown: boolean;
  toggleDropDown: Function;
  choiceSelection: Function;
};

const DropDown: React.FC<DropDownProps> = ({
  choices,
  choiceSelection,
}: DropDownProps): JSX.Element => {
  const [showDropDown, setShowDropDown] = useState<boolean>(false);

  const onClickHandler = (choice: string): void => {
    choiceSelection(choice);
  };

  useEffect(() => {
    setShowDropDown(showDropDown);
  }, [showDropDown]);

  return (
    <>
      <div className={showDropDown ? 'dropdown' : 'dropdown active'}>
        {choices.map(
          (choice: string, index: number): JSX.Element => {
            return (
              <p
                key={index}
                onClick={(): void => {
                  onClickHandler(choice);
                }}
              >
                {choice}
              </p>
            );
          }
        )}
      </div>
    </>
  );
};

export default DropDown;
