// ESLint flat config (v9+) - CommonJS compatible
// Rules focused on catching real bugs, not style bikeshedding.

const nodeGlobals = {
  // Process & module
  process: "readonly", __dirname: "readonly", __filename: "readonly",
  require: "readonly", module: "writable", exports: "writable",
  // Built-ins
  Buffer: "readonly", console: "readonly",
  setTimeout: "readonly", setInterval: "readonly",
  clearTimeout: "readonly", clearInterval: "readonly",
  // Web-compat globals available since Node 18
  fetch: "readonly",
  URLSearchParams: "readonly",
  URL: "readonly",
  FormData: "readonly",
  AbortController: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly"
};

module.exports = [
  {
    files: ["backend/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: nodeGlobals },
    rules: {
      // Catch real bugs
      "no-unused-vars":        ["warn", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-undef":              "error",
      "no-unreachable":        "error",
      "no-duplicate-case":     "error",
      "no-empty":              ["warn", { allowEmptyCatch: true }],
      "no-fallthrough":        "error",
      "no-loss-of-precision":  "error",
      // Async safety
      "no-async-promise-executor": "error",
      "no-await-in-loop":          "warn",
      "require-atomic-updates":    "warn",
      // Security
      "no-eval":          "error",
      "no-new-func":      "error",
      "no-implied-eval":  "error",
      // Quality
      "eqeqeq":       ["error", "always", { "null": "ignore" }],
      "prefer-const": "warn",
      "no-var":       "warn"
    }
  },
  { ignores: ["node_modules/**", "backend/uploads/**"] }
];
