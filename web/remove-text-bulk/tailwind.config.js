module.exports = {
  // Uncomment the line below to enable the experimental Just-in-Time ("JIT") mode.
  // https://tailwindcss.com/docs/just-in-time-mode
  mode: 'jit',
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        chessboard: `url('data:image/svg+xml, \
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="lightgrey" fill-opacity=".5" >\
            <rect x="5" width="5" height="5" />\
            <rect y="5" width="5" height="5" />\
          </svg>')`,
      },
    },
  },
  variants: {
    extend: {
      display: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
  // Filenames to scan for classes
  content: [
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    './public/index.html',
  ],
}
