module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.eslint.json", "./packages/*/tsconfig.json"],
    },
    plugins: ["@typescript-eslint", "eslint-plugin-import"],
    ignorePatterns: [
        "tests/cases/**",
        "**/out/**",
        "**/dist/**",
        ".eslintrc.cjs",
        "**/scripts/**/*.js",
        "**/.vscode-test/**",
    ],
    root: true,
    rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-floating-promises": "off",
    },
    overrides: [
        {
            files: ["packages/api/**"],
            rules: {
                "import/no-extraneous-dependencies": [
                    "error",
                    {
                        devDependencies: false,
                    },
                ],
            },
        },
    ],
}
