import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: [
    'dist',
  ],
  node: true,
  typescript: true,
}, {
  rules: {
    // 'import/consistent-type-specifier-style': 'off',
    // 'no-console': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
    // 'no-useless-return': 'off',
    // 'perfectionist/sort-imports': 'off',
    // 'perfectionist/sort-named-imports': 'off',
    'style/brace-style': 'off',
    // 'style/eol-last': 'off',
    // 'style/indent': 'off',
    'style/member-delimiter-style': 'off',
    // 'style/multiline-ternary': 'off',
    // 'style/operator-linebreak': 'off',
    // 'style/quotes': 'off',
    'style/semi': 'off',
    // 'ts/consistent-type-definitions': 'off',
    // 'ts/consistent-type-imports': 'off',
    'unused-imports/no-unused-imports': 'error',
  },
})
