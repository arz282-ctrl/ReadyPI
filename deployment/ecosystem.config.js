module.exports = {
  apps: [
    {
      name: 'readypi-api',
      script: 'npm',
      args: 'start',
      cwd: './api',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      }
    },
    {
      name: 'readypi-dashboard',
      script: 'npm',
      args: 'start',
      cwd: './dashboard',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
