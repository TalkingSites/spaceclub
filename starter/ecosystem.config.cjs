// Site: http://localhost:8090  Spacedash with local files, no sign-in: http://localhost:8090/admin/
// Its real preview comes from SpaceClub's server on :8092 (run `npm run build` once so it has the site's assets)
module.exports = {
  apps: [
    { name: 'spaceclub-site', script: 'npm', args: 'start -- --port 8090', cwd: __dirname },
    { name: 'spaceclub-site-cms', script: 'npx', args: 'decap-server', cwd: __dirname },
    { name: 'spaceclub-site-preview', script: 'node_modules/spaceclub/server/index.cjs', cwd: __dirname, env: { PORT: '8092', SPACEDASH_LOCAL: '1' } },
  ],
};
