import js from "@eslint/js"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
import "eslint-plugin-only-warn"
import vue from "eslint-plugin-vue"
import globals from "globals"

export default [
    {
        name: "app/files-to-lint",
        files: ["**/*.{ts,mts,tsx,vue}"],
    },

    {
        name: "app/files-to-ignore",
        ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
    },

    js.configs.recommended,
    ...vue.configs["flat/essential"],

    {
        name: "app/vue-rules",
        files: ["**/*.vue"],
        languageOptions: {
            parserOptions: {
                parser: tsparser,
                extraFileExtensions: [".vue"],
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        rules: {
            quotes: ["warn", "double"],
            "brace-style": ["warn", "allman", { "allowSingleLine": true }],
        },
    },

    {
        name: "app/typescript-rules",
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsparser,
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            indent: ["warn", 4],
            quotes: ["warn", "double"],
            "brace-style": ["warn", "allman", { "allowSingleLine": true }],
        },
    },

    {
        name: "app/javascript-rules",
        files: ["**/*.{js,mjs}"],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            indent: ["warn", 4],
            quotes: ["warn", "double"],
            "brace-style": ["warn", "allman", { "allowSingleLine": true }],
        },
    },
]
