#!/usr/bin/env node
// The spaceclub command: makes a new site from starter/ and copies package files into a site to customise.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const pkgDir = path.join(__dirname, "..");
const version = require(path.join(pkgDir, "package.json")).version;

const HELP = `SpaceClub ${version}

  npx spaceclub new <folder>         make a new site in <folder> and install it
  npx spaceclub customize            list the files you can customise
  npx spaceclub customize <file>     copy one into src/ to change it, e.g. partials/navbar.njk
  npx spaceclub help                 show this

Options for new:  --no-install  skip npm install
`;

// what the starter keeps out of a new site
const SKIP = new Set(["_site", "node_modules", ".cache", "package-lock.json"]);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const src = path.join(from, e.name);
    // npm drops files called .gitignore, so the package ships it as gitignore
    const dest = path.join(to, e.name === "gitignore" ? ".gitignore" : e.name);
    if (e.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function newSite(folder, { install }) {
  if (!folder) return fail("Name the folder for the site: npx spaceclub new my-site");
  const dir = path.resolve(folder);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) return fail(`${folder} already exists and isn't empty.`);
  const name = path.basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "spaceclub-site";

  copyDir(path.join(pkgDir, "starter"), dir);

  // named after the site, on this version of SpaceClub
  const sitePkg = path.join(dir, "package.json");
  const json = JSON.parse(fs.readFileSync(sitePkg, "utf8"));
  json.name = name;
  json.dependencies = { ...json.dependencies, spaceclub: `^${version}` };
  fs.writeFileSync(sitePkg, JSON.stringify(json, null, 2) + "\n");

  // pm2 apps named after the site, so two sites on one computer don't clash
  const eco = path.join(dir, "ecosystem.config.cjs");
  if (fs.existsSync(eco)) fs.writeFileSync(eco, fs.readFileSync(eco, "utf8").replaceAll("'spaceclub-site", `'${name}`));

  console.log(`Made ${name} in ${folder}`);
  if (install) {
    console.log("Installing...");
    const r = spawnSync("npm", ["install"], { cwd: dir, stdio: "inherit", shell: process.platform === "win32" });
    if (r.status !== 0) return fail(`npm install failed. Run it yourself in ${folder}.`);
  }
  const cd = /\s/.test(folder) ? JSON.stringify(folder) : folder;
  console.log(`\nNext:\n  cd ${cd}\n${install ? "" : "  npm install\n"}  npm start          the site at http://localhost:8080\n\nSettings are in spaceclub.json, content in src/.`);
}

// package files a site can have its own copy of, and where that copy goes in src/
function customisable() {
  const list = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(pkgDir, "plugin", rel), { withFileTypes: true })) {
      const sub = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(sub);
      else if (sub.startsWith("_includes/") || sub.startsWith("assets/")) list.push({ name: sub.replace(/^_includes\//, ""), from: sub, to: sub });
      else if (sub.startsWith("pages/")) list.push({ name: sub, from: sub, to: sub.slice("pages/".length) });
    }
  };
  walk("");
  return list;
}

function customize(file) {
  const files = customisable();
  if (!file) {
    console.log("Files you can customise (npx spaceclub customize <file>):\n");
    for (const f of files) console.log(`  ${f.name}`);
    return;
  }
  const f = files.find((x) => x.name === file || x.from === file || x.to === file || path.basename(x.name) === file);
  if (!f) return fail(`SpaceClub has no ${file}. Run npx spaceclub customize to see the list.`);
  if (!fs.existsSync("spaceclub.json")) return fail("Run this in your site's folder (the one with spaceclub.json).");
  const dest = path.join("src", f.to);
  if (fs.existsSync(dest)) return fail(`${dest} is already yours.`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(pkgDir, "plugin", f.from), dest);
  console.log(`Copied to ${dest}. Your copy is used instead of SpaceClub's; delete it to go back.`);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const [cmd, ...args] = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const rest = args.filter((a) => !a.startsWith("--"));
if (cmd === "new") newSite(rest[0], { install: !flags.includes("--no-install") });
else if (cmd === "customize" || cmd === "customise") customize(rest[0]);
else if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") console.log(HELP);
else fail(`Unknown command: ${cmd}\n\n${HELP}`);
