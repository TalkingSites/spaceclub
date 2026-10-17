// Site: http://localhost:8090  Spacedash with local files, no sign-in: http://localhost:8090/admin/
// Its real preview comes from server.js on :8092 (run `npm run build` once so it has the site's assets)
module.exports = {
  apps: [
    { name: 'spaceclub-template', script: 'npm', args: 'start -- --port 8090', cwd: __dirname },
    { name: 'spaceclub-template-cms', script: 'npx', args: 'decap-server', cwd: __dirname },
    { name: 'spaceclub-template-preview', script: 'server.js', cwd: __dirname, env: { PORT: '8092', SPACEDASH_LOCAL: '1' } },
  ],
};
