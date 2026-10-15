// Site: http://localhost:8090  Spacedash with local files, no sign-in: http://localhost:8090/admin/
module.exports = {
  apps: [
    { name: 'spaceclub-template', script: 'npm', args: 'start -- --port 8090', cwd: __dirname },
    { name: 'spaceclub-template-cms', script: 'npx', args: 'decap-server', cwd: __dirname },
  ],
};
