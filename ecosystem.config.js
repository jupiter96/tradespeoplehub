/**
 * PM2 Ecosystem Configuration
 * This file configures PM2 to manage the application
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup  # (run once to enable auto-start on server reboot)
 */
module.exports = {
  apps: [
    {
      name: 'sortars',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Auto restart on crash
      autorestart: true,
      // Watch for file changes (disable in production)
      watch: false,
      // Max memory usage before restart
      max_memory_restart: '1G',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Merge logs from all instances
      merge_logs: true,
      // Node.js arguments
      node_args: '--experimental-modules',
      // Restart delay
      min_uptime: '10s',
      max_restarts: 10,
      // Environment variables (override with .env file)
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};

