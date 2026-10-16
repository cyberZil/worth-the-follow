#!/usr/bin/env node
// Validates every lens YAML in lenses/core and lenses/community against lenses/schema.json,
// and compiles them into app/src/lenses.generated.json for the app to load.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(root, "lenses/schema.json"), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const dirs = ["lenses/core", "lenses/community"];
const lenses = [];
const errors = [];
const seenIds = new Set();

for (const dir of dirs) {
  let files = [];
  try {
    files = readdirSync(join(root, dir)).filter((f) => /\.ya?ml$/.test(f));
  } catch {
    continue;
  }
  for (const file of files) {
    const path = join(dir, file);
    let data;
    try {
      data = YAML.parse(readFileSync(join(root, path), "utf8"));
    } catch (e) {
      errors.push(`${path}: YAML parse error — ${e.message}`);
      continue;
    }
    if (!validate(data)) {
      for (const err of validate.errors) {
        errors.push(`${path}: ${err.instancePath || "/"} ${err.message}`);
      }
      continue;
    }
    const stem = basename(file).replace(/\.ya?ml$/, "");
    if (data.id !== stem) errors.push(`${path}: id "${data.id}" must match file name "${stem}"`);
    if (seenIds.has(data.id)) errors.push(`${path}: duplicate id "${data.id}"`);
    seenIds.add(data.id);

    // Soft checks: warn, don't fail.
    if (!data.counter_signals?.length) console.warn(`warn ${path}: no counter_signals (strongly encouraged)`);
    const personWords = /\b(people who|person who|type of person|these people|narcissist|loser|idiot)\b/i;
    if (personWords.test(data.description)) {
      errors.push(`${path}: description should describe content patterns, not label people`);
    }

    lenses.push({ ...data, pack: dir.split("/")[1], version: data.version ?? 1, weight: "user-set" });
  }
}

if (errors.length) {
  console.error(`\n${errors.length} lens error(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

const out = join(root, "app/src/lenses.generated.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(lenses, null, 2) + "\n");
console.log(`✓ ${lenses.length} lens(es) valid → app/src/lenses.generated.json`);
