# Deployment Guide - Online Banking Management System

This document outlines the three primary ways to deploy the **Online Banking Management System (OBMS)** to production:

- **Method 1:** Cloud Platforms (Render / Railway for Backend + Vercel for Frontend) — *Recommended for academic evaluation, demonstrations, and portfolios.*
- **Method 2:** Single VPS / Cloud Server (Ubuntu, AWS EC2, DigitalOcean) with Nginx & Gunicorn.
- **Method 3:** 1-Command Containerized Deployment with Docker Compose.

---

## ☁️ Method 1: Cloud Deployment (Render / Railway + Vercel)

This is the easiest and most modern deployment approach.

### Step 1: Push Code to GitHub
Ensure your repository is pushed to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - Online Banking System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/banking-system.git
git push -u origin main
```

---

### Step 2: Deploy Backend to Render (or Railway)
1. Go to [render.com](https://render.com) and create an account.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   - **Name:** `banking-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python seed_data.py && python manage.py collectstatic --noinput`
   - **Start Command:** `gunicorn banking_core.wsgi:application`
5. Under **Environment Variables**, add:
   - `SECRET_KEY`: *(Generate a random string)*
   - `USE_MYSQL`: `False` *(or configure a managed MySQL / PostgreSQL database)*
6. Click **Deploy Web Service**.
7. Copy your backend live URL (e.g. `https://banking-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel (or Netlify)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your repository.
4. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://banking-backend.onrender.com/api` *(Your Render backend URL with `/api`)*
6. Click **Deploy**.
7. Vercel will provide your live frontend URL (e.g. `https://banking-system.vercel.app`).

---

## 🐳 Method 2: Docker Compose Deployment (1-Command)

If you have Docker and Docker Compose installed on your server (local or cloud VM):

```bash
# In the project root directory:
docker compose up -d --build
```

This command automatically:
1. Starts a **MySQL 8.0** container initialized with `database_schema.sql`.
2. Builds the **Django backend** container, runs migrations, seeds initial data, and starts Gunicorn on port `8000`.
3. Compiles the **React frontend** and serves it with **Nginx** on port `80`.

Open your browser at:
`http://localhost` (or `http://YOUR_SERVER_IP`)

---

## 🖥️ Method 3: Ubuntu VPS Deployment (AWS EC2 / DigitalOcean)

Deploying onto a standard Ubuntu 22.04 / 24.04 LTS Linux server.

### 1. Initial Server Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git mysql-server
```

### 2. Configure MySQL Database
```bash
sudo mysql -u root
```
Inside MySQL prompt:
```sql
CREATE DATABASE online_banking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bank_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON online_banking_db.* TO 'bank_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clone Repository & Setup Backend
```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/banking-system.git
cd banking-system

# Virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Migrate and seed
cd backend
export USE_MYSQL=True
export DB_NAME=online_banking_db
export DB_USER=bank_user
export DB_PASSWORD='StrongPassword123!'
python manage.py migrate
python seed_data.py
python manage.py collectstatic --noinput
```

### 4. Create Gunicorn Systemd Service
Create `/etc/systemd/system/banking.service`:
```ini
[Unit]
Description=Gunicorn daemon for Banking System
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/banking-system/backend
ExecStart=/var/www/banking-system/venv/bin/gunicorn --access-logfile - --workers 3 --bind 127.0.0.1:8000 banking_core.wsgi:application
Environment="USE_MYSQL=True"
Environment="DB_NAME=online_banking_db"
Environment="DB_USER=bank_user"
Environment="DB_PASSWORD=StrongPassword123!"

[Install]
WantedBy=multi-user.target
```
Start and enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start banking
sudo systemctl enable banking
```

### 5. Build and Deploy React Frontend
```bash
cd /var/www/banking-system/frontend
# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install
npm run build
```

### 6. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/banking`:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # Serve built React SPA
    location / {
        root /var/www/banking-system/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API requests to Gunicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve Django static files
    location /static/ {
        alias /var/www/banking-system/backend/staticfiles/;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/banking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Enable Free HTTPS (SSL) with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

Your system is now deployed with full HTTPS encryption!
