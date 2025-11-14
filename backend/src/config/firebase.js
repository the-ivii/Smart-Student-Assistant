import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;

const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.RENDER || 
                     process.env.VERCEL || 
                     process.env.RAILWAY_ENVIRONMENT;


if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log('Using Firebase credentials from environment variables');
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@smart-study-assistant-aa394.iam.gserviceaccount.com")}`
  };
} 
else if (!isProduction && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    console.log('Using Firebase service account from file path (local development only)');
    const serviceAccountData = readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
    serviceAccount = JSON.parse(serviceAccountData);
  } catch (error) {
    console.error('Failed to read Firebase service account from file:', error.message);
    throw new Error('Firebase service account file not found. Please configure environment variables or file path.');
  }
}
else {
  if (isProduction) {
    console.error('Firebase Admin SDK not configured for production deployment!');
    console.error('REQUIRED environment variables for deployment:');
    console.error('   - FIREBASE_PROJECT_ID');
    console.error('   - FIREBASE_PRIVATE_KEY');
    console.error('   - FIREBASE_PRIVATE_KEY_ID');
    console.error('   - FIREBASE_CLIENT_EMAIL');
    console.error('   - FIREBASE_CLIENT_ID');
    console.error('');
    console.error('See FIREBASE_DEPLOYMENT_GUIDE.md for setup instructions.');
    throw new Error('Firebase Admin SDK not configured. Environment variables are required for production deployment.');
  } else {
    console.error('Firebase Admin SDK not configured. Please configure:');
    console.error('   1. Set FIREBASE_PRIVATE_KEY and related env vars (recommended for all environments)');
    console.error('   2. Set FIREBASE_SERVICE_ACCOUNT_PATH (for local development with JSON file)');
    console.error('');
    console.error('See FIREBASE_DEPLOYMENT_GUIDE.md for setup instructions.');
    throw new Error('Firebase Admin SDK not configured. See error above for setup instructions.');
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export default admin;

