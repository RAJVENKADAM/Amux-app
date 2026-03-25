# Amux App

Fullstack application with:
- **Backend**: Node.js/Express/MongoDB API (Amux-backend)
- **Mobile**: React Native/Expo app (hirhub-mobile, slug: amux)

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev  # or npm start (uses nodemon for dev)
```
- Runs on http://localhost:5000
- MongoDB: Update `.env` with MONGO_URI
- Cloudinary/Razorpay: Keys in `.env`

### Mobile
```bash
cd mobile
npm install
npx expo start  # or yarn expo start
```
- API: Update `src/config/api.js` or env for backend URL
- Android/iOS/Web supported

## Features
- User auth (OTP/email)
- Profiles, courses, payments (Razorpay)
- Push notifications (Expo)
- Uploads (Cloudinary)
- Feed, search, notifications

## Environment Variables (Backend .env.example)
```
MONGO_URI=mongodb://...
JWT_SECRET=...
CLOUDINARY_URL=...
RAZORPAY_KEY_ID=...
EXPO_PUSH_TOKEN=...
SMTP_HOST=...
```

## Scripts (Backend cleanup - ignore)
Admin DB reset tools in `backend/scripts/` (gitignore'd).

## License
ISC
