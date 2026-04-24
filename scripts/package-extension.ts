import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

type Manifest = {
	name: string;
	version: string;
};

const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as Manifest;
const slug = manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const distDir = join(root, "dist");
const output = join(distDir, `${slug}-${manifest.version}-chrome.zip`);

const packageFiles = [
	"manifest.json",
	"background.js",
	"content.js",
	"options.js",
	"popup.js",
	"continue.js",
	"options.html",
	"popup.html",
	"continue.html",
	"options.css",
	"popup.css",
	"continue.css",
	"icons/icon-16.png",
	"icons/icon-48.png",
	"icons/icon-128.png",
	"LICENSE",
	"README.md",
];

const missingFiles = packageFiles.filter((file) => !existsSync(join(root, file)));

if (missingFiles.length > 0) {
	console.error(`Cannot package extension. Missing files:\n${missingFiles.map((file) => `- ${file}`).join("\n")}`);
	process.exit(1);
}

mkdirSync(distDir, { recursive: true });

if (existsSync(output)) {
	unlinkSync(output);
}

const result = spawnSync("zip", ["-X", "-r", output, ...packageFiles], {
	cwd: root,
	stdio: "inherit",
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

if (result.status !== 0) {
	process.exit(result.status ?? 1);
}

console.log(`Created ${output}`);
