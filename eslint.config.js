import tseslint from "typescript-eslint";

export default [
    ...tseslint.configs.recommended,

    {
        files: ["**/*.ts", "**/*.tsx"],

        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json"
            }
        },

        rules: {
             "object-curly-spacing": ["error", "always"],
            indent: ["error", "tab"],
            semi: ["error", "always"],
            quotes: ["error", "single"],
            "@typescript-eslint/no-unused-vars": "warn",
            "max-len": [ "error", {
                code: 120,
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreComments: true
                }
            ]
        }
    }
];