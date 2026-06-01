import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { formatSuggestions, inspectReadme } from "../src/index.js";

test("passes a healthy README", () => {
  const result = inspectReadme(`# Useful CLI

[![CI](https://img.shields.io/badge/ci-passing-brightgreen)](https://example.com)

Useful CLI helps maintainers check project quality before publishing on GitHub.

![Demo](demo.gif)

## Installation

\`\`\`bash
npm install useful-cli
\`\`\`

## Usage

\`\`\`bash
npx useful-cli .
\`\`\`

## Contributing

Run tests before opening a pull request.

## License

MIT
`);

  assert.equal(result.failed, 0);
  assert.equal(result.score, 100);
});

test("reports missing README sections", () => {
  const result = inspectReadme("# Tiny\n\nDoes a thing.");

  assert.ok(result.score < 60);
  assert.ok(result.checks.find((check) => check.id === "installation" && !check.passed));
  assert.ok(result.checks.find((check) => check.id === "usage" && !check.passed));
});

test("formats actionable suggestions", () => {
  const result = inspectReadme("# Tiny\n\nDoes a thing.");
  const suggestions = formatSuggestions(result, "README.md");

  assert.match(suggestions, /Installation/);
  assert.match(suggestions, /Usage/);
  assert.match(suggestions, /Score:/);
});

test("CLI help renders", () => {
  const bin = fileURLToPath(new URL("../bin/readme-doctor.js", import.meta.url));
  const output = execFileSync(process.execPath, [bin, "--help"], { encoding: "utf8" });

  assert.match(output, /Usage: readme-doctor/);
});
