# ReadyPI Production Deployment Checklist

## 1. Domain & DNS
- [ ] Purchase `readypi.io` (or verify ownership).
- [ ] Point A record to DigitalOcean Droplet IP.
- [ ] Point WWW CNAME to `readypi.io`.

## 2. Server Preparation (Ubuntu 22.04+)
- [ ] SSH into droplet: `ssh root@your_ip`
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js 20: 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Install Nginx: `sudo apt install nginx -y`

## 3. Code Deployment
- [ ] Clone repository: `git clone https://github.com/your-repo/ReadyPI.git`
- [ ] Setup API `.env`:
  - `cd api && cp .env.example .env && nano .env`
  - Fill in production keys (JWT_SECRET, AI Provider Keys, Database URL).
- [ ] Setup Dashboard `.env`:
  - `cd dashboard && nano .env.local`
  - `NEXT_PUBLIC_API_URL=https://readypi.io/api`
- [ ] Install dependencies & Build:
  ```bash
  cd api && npm install
  cd ../dashboard && npm install && npm run build
  ```

## 4. Process Management
- [ ] Start with PM2: `pm2 start deployment/ecosystem.config.js`
- [ ] Save PM2 list: `pm2 save`
- [ ] Set PM2 to start on boot: `pm2 startup` (and run the command it gives)

## 5. Nginx & SSL
- [ ] Copy Nginx config: `sudo cp deployment/nginx.conf /etc/nginx/sites-available/readypi`
- [ ] Link config: `sudo ln -s /etc/nginx/sites-available/readypi /etc/nginx/sites-enabled/`
- [ ] Test Nginx: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx -y`
- [ ] Get SSL: `sudo certbot --nginx -d readypi.io -d www.readypi.io`

## 6. Verification
- [ ] Visit `https://readypi.io`
- [ ] Test Signup/Login.
- [ ] Test API key generation.
- [ ] Test a live AI request via the endpoint.
