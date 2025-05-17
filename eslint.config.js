import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**"], // It's good practice to ensure dist is fully ignored
  },
  {
    // Apply these rules to TypeScript and TSX files
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Consider adding ...tseslint.configs.recommendedTypeChecked if you set up parserOptions.project
    ],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // Consider adding "@typescript-eslint": tseslint.plugin, if not already implicitly handled by extends
    },
    languageOptions: {
      ecmaVersion: 2022, // Updated to a more recent version
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Add other global environments if needed, e.g., globals.node for Node.js specific files
      },
      parser: tseslint.parser, // Explicitly set the parser
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // For type-aware linting (optional but recommended for stronger checks):
        // project: true, // or './tsconfig.json' - ensure this points to your TS config
        // tsconfigRootDir: import.meta.dirname, // or process.cwd() if not using ES modules here
      },
    },
    rules: {
      // Spread the recommended rules from react-hooks
      ...reactHooks.configs.recommended.rules,

      // Configure react-refresh plugin
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript specific rules - customize as needed
      "@typescript-eslint/no-unused-vars": [
        "warn", // Changed from "off" to "warn" to catch unused variables
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Example: warn on 'any' type

      // Add other rules or override existing ones here
      // e.g., "no-console": "warn", // To warn about console.log statements
    },
  },
  {
    // Configuration for JavaScript files (e.g., .js, .cjs, .mjs)
    // You might want a separate config for JS files if their rules differ significantly
    files: ["**/*.{js,cjs,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module", // or "commonjs" if applicable
      globals: {
        ...globals.node, // Example: for Node.js specific JS files like build scripts
        // ...globals.browser, // If these JS files also run in the browser
      },
    },
    rules: {
      // JS-specific rules or overrides
      // "no-console": "off", // Example: allow console in JS utility scripts
    },
  }
);