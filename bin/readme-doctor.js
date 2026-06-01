#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { formatReport, formatSuggestions, inspectReadme } from "../src/index.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  const target = resolveReadmePath(args.path ?? process.cwd());
  const markdown = fs.readFileSync(target, "utf8");
  const result = inspectReadme(markdown);

  if (args.json) {
    console.log(JSON.stringify({ target, ...result }, null, 2));
  } else {
    process.stdout.write(formatReport(result, path.relative(process.cwd(), target) || target));
  }

  if (args.writeSuggestions) {
    const outPath = path.resolve(process.cwd(), args.output ?? "README.suggestions.md");
    fs.writeFileSync(outPath, formatSuggestions(result, path.relative(process.cwd(), target) || target));
    if (!args.json) {
      console.log(`Suggestions written to ${outPath}`);
    }
  }

  if (typeof args.failUnder === "number" && result.score < args.failUnder) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`readme-doctor: ${error.message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    path: undefined,
    json: false,
    writeSuggestions: false,
    output: undefined,
    failUnder: undefined,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--write-suggestions") {
      parsed.writeSuggestions = true;
    } else if (arg === "--out" || arg === "-o") {
      parsed.output = argv[++index];
    } else if (arg === "--fail-under") {
      const value = Number(argv[++index]);
      if (!Number.isFinite(value)) {
        throw new Error("--fail-under expects a number");
      }
      parsed.failUnder = value;
    } else if (!arg.startsWith("-") && !parsed.path) {
      parsed.path = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function resolveReadmePath(inputPath) {
  const absolute = path.resolve(process.cwd(), inputPath);
  const stat = fs.statSync(absolute);

  if (stat.isDirectory()) {
    const candidates = ["README.md", "readme.md", "Readme.md"].map((name) => path.join(absolute, name));
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) {
      throw new Error(`No README.md found in ${absolute}`);
    }
    return found;
  }

  return absolute;
}

function printHelp() {
  console.log(`Usage: readme-doctor [path] [options]

Options:
  --json                 Print machine-readable JSON
  --write-suggestions    Write README.suggestions.md
  --out <file>           Output path for suggestions
  --fail-under <score>   Exit with code 1 when score is below score
  -h, --help             Show help
`);
}
