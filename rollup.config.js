import typescript from 'rollup-plugin-typescript';

export default {
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