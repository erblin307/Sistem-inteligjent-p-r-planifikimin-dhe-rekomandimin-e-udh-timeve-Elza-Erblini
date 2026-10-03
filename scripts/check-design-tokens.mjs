#!/usr/bin/env node
/**
 * Guards the design system. The Tailwind theme already refuses classes that
 * are not tokens (p-3, text-blue-500, rounded-2xl). This catches the escape
 * hatches: arbitrary values for spacing, colour, type, radius and shadow, and
 * effects the system rules out.
 *
 * Arbitrary values remain allowed for layout geometry (grid templates,
 * aspect ratios, calc positions) and inside src/components/ui, where Radix
 * CSS variables need them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../src", import.meta.url).pathname;

const rules = [
  {
    name: "arbitrary spacing",
    re: /(?<![\w-])-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[[^\]]+\]/g,
  },
  {
    name: "arbitrary colour",
    re: /(?<![\w-])(?:bg|text|border|ring|fill|stroke|outline|decoration)-\[(?:#|rgb|hsl|oklch)[^\]]*\]/g,
  },
  { name: "arbitrary font size", re: /(?<![\w-])text-\[\d[^\]]*\]/g },
  { name: "arbitrary radius", re: /(?<![\w-])rounded(?:-[trblse]{1,2})?-\[[^\]]+\]/g },
  { name: "custom shadow", re: /(?<![\w-])shadow-(?!overlay\b|none\b)[\w[\]-]+/g },
  { name: "gradient", re: /(?<![\w-])bg-(?:linear|radial|conic|gradient)-[\w-]+/g },
  { name: "glass effect", re: /(?<![\w-])backdrop-(?:blur|saturate)[\w-]*/g },
  { name: "font weight above 600", re: /(?<![\w-])font-(?:bold|extrabold|black)\b/g },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(tsx?|jsx?)$/.test(entry)) yield path;
  }
}

let failures = 0;
for (const file of walk(root)) {
  const rel = relative(process.cwd(), file);
  const inPrimitives = rel.includes("components/ui/");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (inPrimitives && rule.name.startsWith("arbitrary")) continue;
      for (const match of line.matchAll(rule.re)) {
        failures++;
        console.error(`${rel}:${i + 1}  ${rule.name}: ${match[0]}`);
      }
    }
  });
}

if (failures) {
  console.error(`\n${failures} design token violation(s). See docs/DESIGN_SYSTEM.md.`);
  process.exit(1);
}
console.log("Design tokens: no violations.");
