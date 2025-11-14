# Frontend .env Setup Guide

## Required Firebase Web App Configuration

For the frontend, you need to get the web app configuration from Firebase Console:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **smart-study-assistant-aa394**
3. Click on the gear icon ⚙️ > **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** > **Web** (</>) icon
6. Copy the configuration values from the `firebaseConfig` object

## Create `frontend/.env` file with the following:

```env
# Backend API URL
VITE_API_URL=https://smart-student-assistant-9p7y.onrender.com

# Firebase Configuration
# Get these from Firebase Console > Project Settings > Your apps > Web app
VITE_FIREBASE_API_KEY=your_api_key_from_console
VITE_FIREBASE_AUTH_DOMAIN=smart-study-assistant-aa394.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-study-assistant-aa394
VITE_FIREBASE_STORAGE_BUCKET=smart-study-assistant-aa394.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_from_console
VITE_FIREBASE_APP_ID=your_app_id_from_console
```

## Example values format:

- `VITE_FIREBASE_API_KEY`: Usually starts with "AIzaSy..." (string)
- `VITE_FIREBASE_AUTH_DOMAIN`: smart-study-assistant-aa394.firebaseapp.com
- `VITE_FIREBASE_PROJECT_ID`: smart-study-assistant-aa394
- `VITE_FIREBASE_STORAGE_BUCKET`: smart-study-assistant-aa394.appspot.com
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Numeric ID (e.g., "123456789012")
- `VITE_FIREBASE_APP_ID`: Format like "1:123456789012:web:abcdef123456" (string)

## Quick Setup Command:

Copy the template and update with your values:

```bash
cp frontend/ENV_EXAMPLE.txt frontend/.env
```

Then edit `frontend/.env` and replace the placeholder values with your actual Firebase web app config values.

