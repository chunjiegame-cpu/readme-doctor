const DEFAULT_RULES = [
  {
    id: "title",
    label: "Project title",
    severity: "high",
    test: (doc) => Boolean(doc.title),
    message: "Add a top-level project title.",
    suggestion: "Start the README with a clear H1, for example `# My Project`."
  },
  {
    id: "description",
    label: "Description",
    severity: "high",
    test: (doc) => doc.descriptionWordCount >= 10,
    message: "Add a concise description of what the project does.",
    suggestion: "Add one short paragraph under the title that explains the audience, the problem, and the result."
  },
  {
    id: "installation",
    label: "Installation",
    severity: "high",
    test: (doc) => doc.hasHeading(["installation", "install", "setup", "getting started"]) || /npm\s+i|npm\s+install|pnpm\s+i|yarn\s+add|pip\s+install|docker\s+pull/i.test(doc.text),
    message: "Document how to install or set up the project.",
    suggestion: "Add an `## Installation` section with the exact command a new user should run."
  },
  {
    id: "usage",
    label: "Usage",
    severity: "high",
    test: (doc) => doc.hasHeading(["usage", "quick start", "examples", "example"]) || doc.commandBlocks.length > 0,
    message: "Show at least one usage example.",
    suggestion: "Add an `## Usage` section with a copy-pasteable command or code snippet."
  },
  {
    id: "license",
    label: "License",
    severity: "medium",
    test: (doc) => doc.hasHeading(["license"]) || /\b(MIT|Apache-2\.0|GPL|BSD|ISC)\b License/i.test(doc.text),
    message: "State the license.",
    suggestion: "Add an `## License` section and include a LICENSE file."
  },
  {
    id: "demo",
    label: "Screenshot or demo",
    severity: "medium",
    test: (doc) => doc.hasImage || /\b(demo|screenshot|gif|video)\b/i.test(doc.text),
    message: "Add a screenshot, GIF, or demo link.",
    suggestion: "Add a small screenshot or demo GIF so visitors understand the result quickly."
  },
  {
    id: "badges",
    label: "Badges",
    severity: "low",
    test: (doc) => doc.hasBadge,
    message: "Add useful badges.",
    suggestion: "Add CI, npm, license, or version badges near the top of the README."
  },
  {
    id: "contributing",
    label: "Contributing",
    severity: "low",
    test: (doc) => doc.hasHeading(["contributing", "development", "contribution"]),
    message: "Explain how people can contribute.",
    suggestion: "Add a short `## Contributing` or `## Development` section with test and setup commands."
  }
];

const SCORE_WEIGHTS = {
  high: 18,
  medium: 11,
  low: 6
};

export function inspectReadme(markdown, options = {}) {
  const rules = options.rules ?? DEFAULT_RULES;
  const doc = analyzeMarkdown(markdown ?? "");
  const checks = rules.map((rule) => {
    const passed = Boolean(rule.test(doc));

    return {
      id: rule.id,
      label: rule.label,
      severity: rule.severity,
      passed,
      message: rule.message,
      suggestion: rule.suggestion
    };
  });

  const penalty = checks
    .filter((check) => !check.passed)
    .reduce((total, check) => total + SCORE_WEIGHTS[check.severity], 0);

  const score = Math.max(0, 100 - penalty);

  return {
    score,
    grade: gradeScore(score),
    passed: checks.filter((check) => check.passed).length,
    failed: checks.filter((check) => !check.passed).length,
    checks
  };
}

export function analyzeMarkdown(markdown) {
  const text = markdown ?? "";
  const headings = [...text.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    text: cleanHeading(match[2])
  }));
  const title = headings.find((heading) => heading.level === 1)?.text ?? "";
  const intro = extractIntro(text);
  const commandBlocks = extractCodeBlocks(text).filter((block) => /\b(npx|npm|pnpm|yarn|node|python|pip|docker|curl|git)\b/i.test(block));

  return {
    text,
    title,
    headings,
    intro,
    descriptionWordCount: countWords(intro),
    commandBlocks,
    hasImage: /!\[[^\]]*]\([^)]+\)/.test(text),
    hasBadge: /\[!\[[^\]]*]\([^)]+\)]\([^)]+\)|shields\.io|badge\.svg/i.test(text),
    hasHeading(candidates) {
      return candidates.some((candidate) => headings.some((heading) => heading.text === candidate));
    }
  };
}

export function formatReport(result, target = "README.md") {
  const lines = [
    `README Doctor report for ${target}`,
    `Score: ${result.score}/100 (${result.grade})`,
    ""
  ];

  for (const check of result.checks) {
    const marker = check.passed ? "PASS" : "MISS";
    lines.push(`[${marker}] ${check.label}`);
    if (!check.passed) {
      lines.push(`  ${check.message}`);
      lines.push(`  Suggestion: ${check.suggestion}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function formatSuggestions(result, target = "README.md") {
  const missing = result.checks.filter((check) => !check.passed);
  const lines = [
    `# README suggestions for ${target}`,
    "",
    `Score: ${result.score}/100 (${result.grade})`,
    ""
  ];

  if (missing.length === 0) {
    lines.push("No missing sections found. Nice work.");
    return `${lines.join("\n")}\n`;
  }

  for (const check of missing) {
    lines.push(`## ${check.label}`);
    lines.push("");
    lines.push(check.suggestion);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function extractIntro(markdown) {
  const withoutBadges = markdown.replace(/^\s*\[?!?\[[^\n]+$/gm, "");
  const afterTitle = withoutBadges.replace(/^#\s+.+$/m, "");
  const beforeFirstSection = afterTitle.split(/^##\s+/m)[0] ?? "";

  return beforeFirstSection
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]+]\([^)]+\)/g, "")
    .trim();
}

function extractCodeBlocks(markdown) {
  return [...markdown.matchAll(/```[\w-]*\n([\s\S]*?)```/g)].map((match) => match[1]);
}

function cleanHeading(value) {
  return value
    .replace(/#+$/, "")
    .replace(/[`*_~:[\]()]/g, "")
    .trim()
    .toLowerCase();
}

function countWords(value) {
  return (value.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
}

function gradeScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
