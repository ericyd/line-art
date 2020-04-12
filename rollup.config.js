import typescript from 'rollup-plugin-typescript';

const lineArtConfig = {
  input: './src/main.ts',
  output: {
    file: 'app.js',
    format: 'iife'
  },
  plugins: [
    typescript({
      target: 'es5',
      removeComments: true
    })
  ]
}

const harmonographConfig = {
  input: './src/harmonograph.ts',
  output: {
    file: 'harmonograph.js',
    format: 'iife'
  },
  plugins: [
    typescript({
      target: 'es5',
      removeComments: true
    })
  ]
}

export default [ lineArtConfig, harmonographConfig ];
