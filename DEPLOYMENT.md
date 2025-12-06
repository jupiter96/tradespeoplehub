# Deployment Guide

This project uses GitHub Actions to automatically deploy to an Ubuntu server.

## Prerequisites

### Server Setup

1. **Prepare Ubuntu Server**
   - Ubuntu 20.04 or higher recommended
   - Install Node.js 20.x
   - Install PM2 globally: `npm install -g pm2`
   - Install Git: `sudo apt-get install git`

2. **Set up Project Directory**
   ```bash
   sudo mkdir -p /var/www/trades-platform
   sudo chown $USER:$USER /var/www/trades-platform
   cd /var/www/trades-platform
   git clone <your-repo-url> .
   ```

3. **Configure Environment Variables**
   ```bash
   cd /var/www/trades-platform
   nano .env
   ```
   
   Required environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/trades-platform
   SESSION_SECRET=your-secret-key-here
   CLIENT_ORIGIN=https://yourdomain.com
   # Other required environment variables...
   ```

4. **Start PM2 and Configure Auto-start**
   ```bash
   cd /var/www/trades-platform
   npm install
   cd client && npm install && cd ..
   npm run build:client
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup  # Configure auto-start on system reboot
   ```

### GitHub Secrets Configuration

Add the following secrets in your GitHub repository's Settings > Secrets and variables > Actions:

1. **DEPLOY_HOST**: Server IP address or domain (e.g., `192.168.1.100` or `example.com`)
2. **DEPLOY_USER**: SSH username (e.g., `ubuntu` or `deploy`)
3. **DEPLOY_SSH_KEY**: SSH private key (key that can access the server)
4. **DEPLOY_PORT**: SSH port (default: 22, optional)
5. **DEPLOY_PATH**: Project path (default: `/var/www/trades-platform`, optional)

#### How to Generate SSH Keys

On your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

Add public key to server:
```bash
# Connect to server
ssh user@your-server

# Add public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Add private key to GitHub Secrets:
```bash
# Copy private key content on local machine
cat ~/.ssh/github_actions_deploy
# Paste entire content into DEPLOY_SSH_KEY secret
```

## Deployment Process

### Automatic Deployment

Deployment starts automatically when you push to `main` or `master` branch:

```bash
git add .
git commit -m "Deploy: Update features"
git push origin main
```

### Manual Deployment

You can select the "Deploy to Ubuntu Server" workflow in the GitHub Actions tab and click the "Run workflow" button.

## Deployment Workflow

1. **Checkout code**: Fetch latest code from GitHub
2. **Setup Node.js**: Configure Node.js 20.x environment
3. **Install dependencies**: Install root and client dependencies
4. **Build client**: Build React app
5. **Deploy to server**: Connect to server via SSH and:
   - Pull latest code
   - Update dependencies
   - Build client
   - Restart application with PM2
6. **Health check**: Check logs after deployment

## PM2 Management Commands

You can manage PM2 directly on the server:

```bash
# Check status
pm2 status

# View logs
pm2 logs trades-platform

# Restart
pm2 restart trades-platform

# Stop
pm2 stop trades-platform

# Start
pm2 start trades-platform

# Delete
pm2 delete trades-platform

# Monitor
pm2 monit
```

## Troubleshooting

### When Deployment Fails

1. **Check GitHub Actions Logs**
   - Check failed workflow in GitHub repository > Actions tab

2. **Check Directly on Server**
   ```bash
   ssh user@your-server
   cd /var/www/trades-platform
   pm2 logs trades-platform
   ```

3. **Try Manual Deployment**
   ```bash
   cd /var/www/trades-platform
   git pull origin main
   npm install
   cd client && npm install && cd ..
   npm run build:client
   pm2 restart trades-platform
   ```

### Common Issues

- **SSH connection failure**: Verify DEPLOY_SSH_KEY is correct
- **Permission error**: Check project directory ownership
- **Build failure**: Verify Node.js version and dependencies
- **PM2 restart failure**: Check PM2 process status

## Security Considerations

1. **Environment variables**: Never commit `.env` file to Git
2. **SSH keys**: Stored securely in GitHub Secrets
3. **Firewall**: Only open necessary ports (22, 80, 443, 5000)
4. **HTTPS**: Recommended to use Nginx for HTTPS in production

## Nginx Reverse Proxy Configuration (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
