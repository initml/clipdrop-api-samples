import type { NextPage } from 'next'
import { twMerge } from 'tailwind-merge'
import DropZone from '../components/DropZone'

import Head from 'next/head'
import { useCallback, useRef, useState } from 'react'

import Landing from '../components/Landing'
import Progress from '../components/Progress'
import Result from '../components/Result'
import Gallery from '../components/Gallery'
import STATES from '../components/States'
import { Templates } from '../profile-pictures/configuration'

type IfProps = {
  condition: boolean
  children: JSX.Element
}

function If({ condition, children }: IfProps) {
  return condition ? <>{children}</> : <></>
}

const ALLOWED_FILES = ['image/png', 'image/jpeg']

const Home: NextPage = () => {
  const [file, setFile] = useState<File | undefined>()
  const [run_processing, setRunProcessing] = useState<boolean>(false)
  const [state, setState] = useState<number>(STATES.TEMPLATE_CHOICE)

  // Templates
  const templates = () => {
    return Object.values(Templates)
  }
  const [selectTemplate, setSelectTemplate] = useState<string | undefined>(
    undefined
  )
  const templateSelection = (template: string): void => {
    console.log('template selected: ' + template)
    setState(STATES.IMAGE_UPLOAD)
    setSelectTemplate(template)
  }

  // Upscale
  const [upscale, setUpscale] = useState(false)
  const handleUpscale = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpscale(e.target.checked)
  }

  const handleFilesSelected = useCallback((files: FileList | Array<File>) => {
    const file = Array.from(files).filter((file) =>
      ALLOWED_FILES.includes(file.type)
    )[0]

    if (file) {
      setFile(file)
    }
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }, [])

  const [dragging, setDragging] = useState(false)
  const handleDragging = useCallback((dragging: boolean) => {
    setDragging(dragging)
  }, [])

  const inputFileRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>ClipDrop Profile Pictures</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* <header className="flex w-full justify-between border-b border-black border-opacity-10 px-4 pl-8">
        <div className="flex items-center space-x-4">
          <h1 className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
            <a href="" target="_blank" rel="noopener noreferrer">
              ClipDrop Profile Pictures
            </a>
          </h1>
        </div>
        <div className="flex items-center space-x-12"></div>
      </header> */}

      <main className="flex w-full flex-1 flex-col items-center text-center">
        <>
          <div>
            <Landing file={file} setFile={setFile} />
            <Progress currentState={state} />
            <div className="w-full py-6">
              <If condition={state == STATES.TEMPLATE_CHOICE}>
                <Gallery
                  choices={templates()}
                  choiceSelection={templateSelection}
                />
              </If>
              <If condition={state == STATES.IMAGE_UPLOAD}>
                <>
                  <div
                    className={twMerge(
                      'mt-16',
                      'w-full overflow-hidden rounded-3xl',
                      'border-4 border-dashed border-black'
                    )}
                  >
                    <DropZone
                      onDrop={(files) => handleFilesSelected(files)}
                      onDrag={handleDragging}
                    >
                      <div
                        className={twMerge(
                          'flex',
                          'flex-col items-center justify-center',
                          'px-8 py-8 text-center sm:py-16',
                          'cursor-pointer',
                          'hover:bg-gray-100',
                          dragging ? 'opacity-50' : ''
                        )}
                        onClick={() => inputFileRef.current?.click()}
                      >
                        <p className="mx-16 text-center font-bold opacity-100">
                          {file
                            ? file.name
                            : 'Drag & drop an image or click here to select'}
                        </p>
                        <input
                          type="file"
                          ref={inputFileRef}
                          className={twMerge(
                            'absolute top-0 bottom-0 left-0 right-0',
                            'hidden'
                          )}
                          accept={ALLOWED_FILES.join(',')}
                          onChange={(ev) =>
                            handleFilesSelected(ev.currentTarget.files ?? [])
                          }
                        />
                      </div>
                    </DropZone>
                  </div>
                  <div class="flex h-36 justify-center space-x-4 pt-20 transition-opacity delay-700 duration-200">
                    <button
                      className="h-full rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 px-10 font-semibold text-white hover:bg-gradient-to-l"
                      onClick={(): void => {
                        if (file && selectTemplate !== undefined) {
                          setState(STATES.RESULT)
                        }
                      }}
                    >
                      Process
                    </button>
                  </div>
                </>
              </If>
              <If condition={state == STATES.RESULT}>
                <Result
                  file={file}
                  template={selectTemplate}
                  upscale={upscale.toString()}
                  setRunProcessing={setRunProcessing}
                />
              </If>
            </div>
          </div>
        </>
      </main>

      <footer className="mt-4 flex h-24 w-full items-center justify-center space-x-12 border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=profile-pictures"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <b className="hover:underline">ClipDrop</b>
        </a>
        <p id="forkongithub">
          <a
            href="https://github.com/initml/clipdrop-api-samples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="mr-3 inline-block"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="font-semibold hover:underline">
              Fork me on GitHub
            </span>
          </a>
        </p>
      </footer>
    </div>
  )
}

export default Home
