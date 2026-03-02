# Alambana Healthcare - Deployment Guide for serverbyt.in

## Build Status
✅ Build completed successfully!
✅ HTML structure fixed
✅ Production-ready bundle created

## Deployment Steps for serverbyt.in

### Method 1: Upload via cPanel File Manager

1. **Build the project locally:**
   ```bash
   cd /app/frontend
   yarn build
   ```

2. **Upload files to server:**
   - Login to your cPanel at serverbyt.in
   - Open File Manager
   - Navigate to `public_html` folder
   - Upload ALL files from `/app/frontend/build/` folder
   - Make sure `.htaccess` file is uploaded (enable "Show Hidden Files")

3. **Set correct permissions:**
   - Files: 644
   - Folders: 755

### Method 2: Upload via FTP

1. **Connect via FTP client (FileZilla):**
   - Host: Your serverbyt.in domain
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21

2. **Upload build folder:**
   - Navigate to `public_html` on server
   - Upload all files from `frontend/build/`
   - Include `.htaccess` file

### Method 3: Deploy via GitHub + cPanel Git

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready build"
   git push origin main
   ```

2. **In cPanel:**
   - Go to "Git Version Control"
   - Create repository from your GitHub URL
   - Set deployment path to `public_html`
   - Click "Update from Remote"

3. **Build on server:**
   ```bash
   cd public_html
   yarn install
   yarn build
   mv build/* .
   ```

## Backend Deployment (FastAPI)

### Option 1: Deploy on same server

1. **Create Python environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure backend URL in frontend:**
   - Update `.env` file:
   ```
   REACT_APP_BACKEND_URL=https://yourdomain.com/api
   ```
   - Rebuild frontend after changing .env

3. **Run backend with gunicorn:**
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --bind 0.0.0.0:8001
   ```

4. **Setup reverse proxy in .htaccess:**
   Add to your .htaccess:
   ```apache
   RewriteRule ^api/(.*)$ http://localhost:8001/api/$1 [P,L]
   ```

### Option 2: Deploy backend separately

- Use services like:
  - Railway.app
  - Render.com
  - Heroku
  - DigitalOcean App Platform

- Update frontend .env with backend URL
- Rebuild frontend

## Fixing 403/404 Errors

### 403 Forbidden
- Check file permissions (files: 644, folders: 755)
- Ensure index.html exists in root
- Check .htaccess syntax
- Verify Apache mod_rewrite is enabled

### 404 Not Found on Routes
- Ensure .htaccess is uploaded and readable
- Enable mod_rewrite in Apache:
  ```bash
  sudo a2enmod rewrite
  sudo systemctl restart apache2
  ```
- Check .htaccess RewriteBase matches your directory

## Environment Variables

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

**Backend (.env):**
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=alambana_healthcare
CORS_ORIGINS=https://yourdomain.com
EMERGENT_LLM_KEY=sk-emergent-1B5E7F962641fF576A
JWT_SECRET_KEY=your_secure_secret_key
RAZORPAY_KEY_ID=rzp_live_SLsf8PIFwbx9Xo
RAZORPAY_KEY_SECRET=kQSr6dlYoJUIA0acCspvE8Tq
```

## Post-Deployment Checklist

- [ ] Frontend loads at root URL
- [ ] All routes work (About, Contact, Login, etc.)
- [ ] API calls reach backend
- [ ] MongoDB connection working
- [ ] Razorpay integration functional
- [ ] Images and assets loading
- [ ] SSL certificate installed (HTTPS)
- [ ] CORS configured correctly

## Troubleshooting

**Issue: Blank page**
- Check browser console for errors
- Verify REACT_APP_BACKEND_URL is correct
- Check if all assets are uploaded

**Issue: API not working**
- Check CORS_ORIGINS in backend
- Verify backend is running
- Test API directly: `curl https://your-backend/api/health`

**Issue: Routes give 404**
- Ensure .htaccess is present
- Check mod_rewrite is enabled
- Verify Apache configuration allows .htaccess overrides

## Support

For deployment issues:
- Check serverbyt.in documentation
- Contact their support team
- Verify your hosting plan supports Node.js/Python

## Quick Test

After deployment, test these URLs:
- `https://yourdomain.com/` - Homepage
- `https://yourdomain.com/about` - About page
- `https://yourdomain.com/login` - Login page
- `https://yourdomain.com/api/health` - Backend health (if same server)

All should load without 404 errors.