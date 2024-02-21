import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { classNames } from './utils'

type PaginationProps = {
  total: number
  page: number
  numPerPage: number
  onPageChange: (page: number) => void
}

function PageButton(props: any) {
  const { num, active, onClick } = props
  return (
    <button
      onClick={onClick}
      className={classNames(
        'relative inline-flex items-center px-4 py-2 bg-white text-sm font-medium focus:outline-none text-gray-700 hover:bg-gray-50',
        active ? 'pointer-events-none bg-gray-100' : ''
      )}
    >
      {num + 1}
    </button>
  )
}

export default function Pagination(props: PaginationProps) {
  const { total, page, numPerPage, onPageChange } = props

  const numPages = Math.ceil(total / numPerPage)
  const isFirstPage = page === 0
  const isLastPage = page === numPages - 1

  function goToPage(p: number) {
    onPageChange(Math.min(Math.max(0, p), numPages - 1))
  }

  function next() {
    goToPage(page + 1)
  }

  function prev() {
    goToPage(page - 1)
  }

  const pages = []
  const startPage = Math.max(0, Math.min(page - 2, numPages - 5))
  const endPage = Math.min(numPages, startPage + 5)
  for (let i = startPage; i < endPage; i++) {
    pages.push(
      <PageButton
        key={i}
        active={page === i}
        num={i}
        onClick={() => goToPage(i)}
      />
    )
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={prev}
          className={classNames(
            isFirstPage ? 'opacity-0' : '',
            'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:text-gray-500'
          )}
        >
          Previous
        </button>

        {!isLastPage && (
          <button
            onClick={next}
            className={classNames(
              isLastPage ? 'opacity-0' : '',
              'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:text-gray-500'
            )}
          >
            Next
          </button>
        )}
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{1 + page * numPerPage}</span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(total, (page + 1) * numPerPage)}
            </span>{' '}
            of <span className="font-medium">{total}</span> files
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md border border-gray-300 overflow-hidden divide-x divide-gray-300 -space-x-px"
            aria-label="Pagination"
          >
            {numPages > 5 && (
              <button
                onClick={prev}
                className={classNames(
                  'relative inline-flex items-center px-2 py-2 rounded-l-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none',
                  isFirstPage ? 'opacity-25 pointer-events-none' : ''
                )}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {pages}

            {numPages > 5 && (
              <button
                onClick={next}
                disabled={isLastPage}
                className={classNames(
                  'relative inline-flex items-center px-2 py-2 rounded-r-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none',
                  isLastPage ? 'opacity-25 pointer-events-none' : ''
                )}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
