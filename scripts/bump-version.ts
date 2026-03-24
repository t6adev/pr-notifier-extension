import { readFileSync, writeFileSync } from "node:fs";

const type = process.argv[2];
if (type !== "patch" && type !== "minor" && type !== "major") {
  console.error("Usage: bump-version.ts <patch|minor|major>");
  process.exit(1);
}

const manifestPath = new URL("../manifest.json", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const [major, minor, patch] = (manifest.version as string).split(".").map(Number);

let newVersion: string;
if (type === "major") newVersion = `${major + 1}.0.0`;
else if (type === "minor") newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

const oldVersion = manifest.version as string;
manifest.version = newVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Version bumped: ${oldVersion} → ${newVersion}`);
