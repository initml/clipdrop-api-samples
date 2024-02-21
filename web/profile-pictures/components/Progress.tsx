import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import STATES from './States'

interface ProgressProps {
  currentState: STATES
}

const Progress: React.FC<ProgressProps> = ({ currentState }) => {
  return (
    <div className="w-full py-6">
      <div className="flex">
        <div className="w-1/3">
          <div className="relative mb-2">
            <div className="mx-auto flex h-10 w-10 items-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-lg text-white">
              <span className="w-full text-center text-white">
                <svg
                  className="w-full fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    className="heroicon-ui"
                    d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm14 8V5H5v6h14zm0 2H5v6h14v-6zM8 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="text-center text-xs md:text-base">
            Choose a template to get started
          </div>
        </div>

        <div className="w-1/3">
          <div className="relative mb-2">
            <div
              className="align-center absolute flex content-center items-center align-middle"
              style={{
                width: 'calc(100% - 2.5rem - 1rem)',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="align-center w-full flex-1 items-center rounded bg-gray-200 align-middle">
                <div
                  className="w-0 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 py-1"
                  style={{
                    width:
                      currentState === STATES.TEMPLATE_CHOICE ? '0%' : '100%',
                  }}
                ></div>
              </div>
            </div>

            <div
              className={`mx-auto flex h-10 w-10 items-center rounded-full ${
                currentState === STATES.TEMPLATE_CHOICE
                  ? 'bg-gray-500'
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
              } text-lg text-white`}
            >
              <span className="w-full text-center text-white">
                <svg
                  className="w-full fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    className="heroicon-ui"
                    d="M19 10h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 0 1 0-2h2V8a1 1 0 0 1 2 0v2zM9 12A5 5 0 1 1 9 2a5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 11a1 1 0 0 1-2 0v-2a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2a1 1 0 0 1-2 0v-2a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v2z"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="text-center text-xs md:text-base">
            Upload your image
          </div>
        </div>

        <div className="w-1/3">
          <div className="relative mb-2">
            <div
              className="align-center absolute flex content-center items-center align-middle"
              style={{
                width: 'calc(100% - 2.5rem - 1rem)',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="align-center w-full flex-1 items-center rounded bg-gray-200 align-middle">
                <div
                  className="w-0 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 py-1"
                  style={{
                    width: currentState !== STATES.RESULT ? '0%' : '100%',
                  }}
                ></div>
              </div>
            </div>

            <div
              className={`mx-auto flex h-10 w-10 items-center rounded-full ${
                currentState !== STATES.RESULT
                  ? 'bg-gray-500'
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
              } text-lg text-white`}
            >
              <span className="w-full text-center text-white">
                <svg
                  className="w-full fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    className="heroicon-ui"
                    d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-2.3-8.7l1.3 1.29 3.3-3.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.42z"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="text-center text-xs md:text-base">Enjoy!</div>
        </div>
      </div>
    </div>
  )
}

export default Progress
