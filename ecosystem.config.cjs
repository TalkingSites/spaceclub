// Developing the spaceclub package: the starter site, built with this package (not the npm one)
// Site: http://localhost:8090  Spacedash (local files, no sign-in): http://localhost:8090/admin/
// Real preview server: :8092 (run `npm run build` once so it has the site's assets)
module.exports = {
  apps: [
    { name: 'spaceclub-template', script: 'npm', args: 'run dev', cwd: __dirname },
    { name: 'spaceclub-template-cms', script: 'npx', args: 'decap-server', cwd: __dirname + '/starter' },
    { name: 'spaceclub-template-preview', script: '../server/index.cjs', cwd: __dirname + '/starter', env: { PORT: '8092', SPACEDASH_LOCAL: '1' } },
  ],
};
