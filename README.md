# README Doctor

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org)
[![CI](https://github.com/chunjiegame-cpu/readme-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/chunjiegame-cpu/readme-doctor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Audit a README before you publish. `readme-doctor` looks for the trust signals that experienced maintainers usually expect: a clear title, useful description, installation path, usage example, license, demo evidence, badges, and contribution notes.

It is deliberately not a prose linter. The goal is to catch missing project information, not argue with your writing style.

## Installation

From source:

```bash
git clone https://github.com/chunjiegame-cpu/readme-doctor.git
cd readme-doctor
npm install
node bin/readme-doctor.js .
```

As a package after publishing:

```bash
npm install -g readme-doctor
readme-doctor .
```

## Usage

```bash
readme-doctor .
readme-doctor README.md --write-suggestions
readme-doctor . --json
readme-doctor . --fail-under 80
readme-doctor . --write-suggestions --out docs/readme-review.md
```

## Sample Output

```text
README Doctor report for README.md
Score: 82/100 (B)

[PASS] Project title
[PASS] Description
[PASS] Installation
[PASS] Usage
[MISS] Screenshot or demo
  Add a screenshot, GIF, or demo link.
  Suggestion: Add a small screenshot or demo GIF so visitors understand the result quickly.
```

## Checks

| Check | Severity | Why it exists |
| --- | --- | --- |
| Project title | High | People should know what they are looking at immediately. |
| Description | High | A repo without a plain-language description is hard to evaluate. |
| Installation | High | Users need the first command before they can try anything. |
| Usage | High | A working example is the fastest way to reduce support questions. |
| License | Medium | Consumers need to know whether they can use the code. |
| Screenshot or demo | Medium | Visual evidence helps visitors understand UI and CLI behavior quickly. |
| Badges | Low | CI, package, and license badges make project state easier to scan. |
| Contributing | Low | Even short development notes reduce drive-by confusion. |

## CLI Reference

| Option | Description |
| --- | --- |
| `--json` | Print the full result as JSON. |
| `--write-suggestions` | Write a Markdown suggestions file. |
| `--out <file>` | Choose the suggestions output path. |
| `--fail-under <score>` | Exit with code `1` if the score is below the threshold. |
| `-h, --help` | Show help. |

## CI Example

```yaml
name: README quality
on: [pull_request]
jobs:
  readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx readme-doctor . --fail-under 80
```

## Programmatic API

```js
import { inspectReadme } from "readme-doctor";

const result = inspectReadme(markdown);
console.log(result.score, result.checks);
```

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | The README was read successfully and no threshold failed. |
| `1` | The README could not be read, arguments were invalid, or `--fail-under` failed. |

## Known Limits

- It does not validate whether commands in examples actually run.
- It scores presence and usefulness signals, not grammar.
- Badge detection is intentionally simple so it stays dependency-free.

## Development

```bash
npm install
npm test
node bin/readme-doctor.js . --json
```

Changes to scoring rules should include a focused test and a README update when the user-facing behavior changes.

## License

MIT
