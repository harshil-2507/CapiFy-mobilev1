# Deployment Guide for Full-Stack Finance App

## Backend Deployment on Railway

### 1. Setup Railway Account
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

### 2. Deploy Backend
```bash
cd backend
railway create finance-app-backend
railway add postgresql
railway deploy
```

### 3. Set Environment Variables
After deployment, set these in Railway dashboard:
- `PORT=8080`
- `GIN_MODE=release`
- `JWT_SECRET=your-super-secret-jwt-key-here`
- `TWILIO_ACCOUNT_SID=your-twilio-sid`
- `TWILIO_AUTH_TOKEN=your-twilio-token`
- `TWILIO_PHONE_NUMBER=your-twilio-phone`

Railway will automatically provide `DATABASE_URL` from PostgreSQL addon.

### 4. Get Backend URL
After deployment, Railway will provide a URL like: `https://finance-app-backend-production.up.railway.app`

## Frontend Deployment (Mobile App)

### 1. Update API Configuration
Update `frontend/capify-mobile/api/axios.js`:
```javascript
const BASE_URL = 'https://your-railway-app-url.up.railway.app';
```

### 2. Setup EAS Build
```bash
cd frontend/capify-mobile
npm install -g @expo/cli @expo/eas-cli
eas login
eas build:configure
```

### 3. Build for Production
```bash
# For Android APK
eas build --platform android --profile production

# For iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### 4. Alternative: Expo Go Development
For testing, you can use Expo Go app:
```bash
npx expo start
```

## Environment Variables Checklist

### Backend (.env)
- ✅ DATABASE_URL (auto-provided by Railway)
- ✅ PORT=8080
- ✅ GIN_MODE=release
- ✅ JWT_SECRET (generate strong secret)
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_PHONE_NUMBER

### Frontend
- ✅ Update BASE_URL to Railway backend URL
- ✅ Remove localhost references

## Testing Production Deployment
1. Test API endpoints with Postman/curl
2. Test mobile app registration/login
3. Verify SMS OTP delivery
4. Test expense tracking functionality
5. Verify user data isolation

## Monitoring & Maintenance
- Monitor Railway logs for errors
- Set up health checks
- Monitor database usage
- Track API response times
