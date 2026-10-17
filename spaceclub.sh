#!/usr/bin/env bash
# spaceclub.sh — SpaceClub! project helper
# Usage: ./spaceclub.sh <command>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colours ──────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD="\033[1m"
  DIM="\033[2m"
  GREEN="\033[32m"
  YELLOW="\033[33m"
  RED="\033[31m"
  CYAN="\033[36m"
  RESET="\033[0m"
else
  BOLD="" DIM="" GREEN="" YELLOW="" RED="" CYAN="" RESET=""
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✔${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
die()     { echo -e "${RED}✘${RESET} $*" >&2; exit 1; }

require_node() {
  command -v node >/dev/null 2>&1 || die "Node.js is not installed. Visit https://nodejs.org"
}

require_modules() {
  require_node
  command -v npm >/dev/null 2>&1 || die "npm is not installed. Visit https://nodejs.org"
  [ -d "$SCRIPT_DIR/node_modules" ] || die "Dependencies not installed. Run: npm install"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_help() {
  echo -e "
${BOLD}SpaceClub! — project helper${RESET}

${BOLD}Usage:${RESET}
  ./spaceclub.sh <command>

${BOLD}Commands:${RESET}
  ${GREEN}build${RESET}       Build the site and generate the search index  → _site/
  ${GREEN}serve${RESET}       Start the local development server (live reload)
  ${GREEN}list${RESET}        Show all pages, posts, and events as JSON
  ${GREEN}clean${RESET}       Delete the _site/ output directory
  ${GREEN}check${RESET}       Verify that all dependencies are installed and ready
  ${GREEN}dry-run${RESET}     Process templates and validate content without writing output
  ${GREEN}index${RESET}       Re-run the Pagefind search index on an existing _site/
  ${GREEN}help${RESET}        Show this message

${DIM}Docs: https://spaceclubwiki.talkingsites.org${RESET}
"
}

cmd_build() {
  require_modules
  info "Building site..."
  npm run build
  success "Build complete → _site/"
}

cmd_serve() {
  require_modules
  info "Starting development server..."
  info "Press Ctrl+C to stop."
  echo ""
  npx @11ty/eleventy --serve
}

cmd_list() {
  require_node  # list-content.js uses only Node built-ins, no node_modules needed
  local script="$SCRIPT_DIR/scripts/list-content.js"
  [ -f "$script" ] || die "scripts/list-content.js not found"
  node "$script" --pretty
}

cmd_clean() {
  local site_dir="$SCRIPT_DIR/_site"
  if [ -d "$site_dir" ]; then
    rm -rf "$site_dir"
    success "Deleted _site/"
  else
    warn "_site/ does not exist — nothing to clean"
  fi
}

cmd_check() {
  local ok=true

  echo -e "\n${BOLD}Checking environment...${RESET}\n"

  if command -v node >/dev/null 2>&1; then
    success "Node.js   $(node --version)"
  else
    warn "Node.js   not found — install from https://nodejs.org"
    ok=false
  fi

  if command -v npm >/dev/null 2>&1; then
    success "npm       $(npm --version)"
  else
    warn "npm       not found — install from https://nodejs.org"
    ok=false
  fi

  if [ -d "$SCRIPT_DIR/node_modules" ]; then
    success "node_modules  present"
  else
    warn "node_modules  missing — run: npm install"
    ok=false
  fi

  if [ -f "$SCRIPT_DIR/package.json" ]; then
    success "package.json  found"
  else
    warn "package.json  not found — is this a SpaceClub project?"
    ok=false
  fi

  echo ""
  if $ok; then
    success "All checks passed — ready to build."
  else
    die "Some checks failed. Fix the issues above before building."
  fi
}

cmd_dryrun() {
  require_modules
  info "Running dry-run (validates templates and content, no output written)..."
  echo ""
  npx @11ty/eleventy --dryrun
  echo ""
  success "Dry-run complete — no files written."
}

cmd_index() {
  require_modules
  local site_dir="$SCRIPT_DIR/_site"
  [ -d "$site_dir" ] || die "_site/ not found. Run './spaceclub.sh build' first."
  info "Re-indexing search..."
  npx pagefind --site _site
  success "Search index updated."
}

# ── Dispatch ──────────────────────────────────────────────────────────────────

COMMAND="${1:-help}"

case "$COMMAND" in
  build)   cmd_build   ;;
  serve)   cmd_serve   ;;
  list)    cmd_list    ;;
  clean)   cmd_clean   ;;
  check)   cmd_check   ;;
  dry-run) cmd_dryrun  ;;
  index)   cmd_index   ;;
  help|--help|-h) cmd_help ;;
  *)
    warn "Unknown command: $COMMAND"
    cmd_help
    exit 1
    ;;
esac
