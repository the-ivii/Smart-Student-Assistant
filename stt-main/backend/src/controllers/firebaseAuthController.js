import { adminAuth, adminDb } from '../config/firebase.js';

export async function getProfile(req, res) {
  try {
    const userId = req.firebaseUid;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    const userData = userDoc.data();
    res.json({
      success: true,
      user: {
        uid: userId,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching profile',
      details: error.message
    });
  }
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  email = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  const domain = parts[1];
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { valid: false, message: 'Invalid email domain' };
  }
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, message: 'Invalid email domain extension' };
  }
  const legitimateProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'yandex.com', 'zoho.com',
    'gmx.com', 'live.com', 'msn.com', 'rediffmail.com', 'sify.com',
    'example.com', 'test.com', 'company.com', 'business.com',
    'edu', 'ac.uk', 'edu.au', 'edu.in',
    'co.uk', 'co.in', 'co.nz', 'co.za',
  ];
  const commonTypos = {
    'gmaail.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'outllok.com': 'outlook.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
  };
  if (commonTypos[domain]) {
    return { 
      valid: false, 
      message: `Did you mean ${parts[0]}@${commonTypos[domain]}? Please use a valid email address.` 
    };
  }
  const baseDomain = domainParts.length >= 2 
    ? domainParts.slice(-2).join('.') 
    : domain;
  const isLegitimateProvider = legitimateProviders.some(provider => {
    if (domain === provider || baseDomain === provider) return true;
    if (provider.startsWith('.') && domain.endsWith(provider)) return true;
    if (!provider.includes('.') && domain.endsWith('.' + provider)) return true;
    return false;
  });
  if (!isLegitimateProvider) {
    const domainName = domainParts[0];
    if (domainName.length > 8) {
      const consonantCount = (domainName.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
      const vowelCount = (domainName.match(/[aeiou]/g) || []).length;
      if (vowelCount === 0 && consonantCount > 8) {
        return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider like Gmail, Yahoo, or Outlook.' };
      }
      if (domainName.length > 10 && vowelCount / domainName.length < 0.15) {
        return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider.' };
      }
    }
    const domainNameLower = domainName.toLowerCase();
    if (domainName.length > 6 && !/[aeiou]/.test(domainNameLower)) {
      return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider like Gmail, Yahoo, or Outlook.' };
    }
  }  
  const invalidPatterns = [
    /^[^@]+@[^@]+@/,
    /\.\./,
    /^\./,
    /\.$/,
    /@\./,
    /\.@/,
  ];
  for (const pattern of invalidPatterns) {
    if (pattern.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
  }
  if (email.length > 254) {
    return { valid: false, message: 'Email address is too long' };
  }
  if (parts[0].length === 0 || parts[0].length > 64) {
    return { valid: false, message: 'Invalid email username' };
  }
  return { valid: true, normalizedEmail: email };
} 
export async function createUserDocument(req, res) {
  try {
    const { uid, username, email, displayName } = req.body;
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: true,
        message: emailValidation.message,
        details: 'Email validation failed on server'
      });
    }    
    const normalizedEmail = emailValidation.normalizedEmail;
    if (req.firebaseUid !== uid) {
      return res.status(403).json({
        error: true,
        message: 'User ID mismatch'
      });
    }    
    if (!username || username.length < 3) {
      return res.status(400).json({
        error: true,
        message: 'Username must be at least 3 characters'
      });
    }    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: true,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const existingData = userDoc.data();
      if (normalizedEmail && existingData.email !== normalizedEmail) {
        await adminDb.collection('users').doc(uid).update({
          email: normalizedEmail,
          updatedAt: new Date().toISOString()
        });
        console.log(`Updated email in Firestore user document for: ${uid}`);
      } else {
        console.log(`Firestore user document exists for: ${uid} (no update needed)`);
      }
    } else {
      await adminDb.collection('users').doc(uid).set({
        username: username || normalizedEmail?.split('@')[0] || 'User',
        email: normalizedEmail,
        displayName: displayName || username || normalizedEmail?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        studyHistory: []
      });
      console.log(`New Firestore user document created for: ${uid}`);
    }

    res.json({
      success: true,
      message: 'User document created/updated successfully'
    });

  } catch (error) {
    console.error('Create user document error:', error);
    if (error.code === 7 || error.message?.includes('SERVICE_DISABLED') || error.message?.includes('Firestore API')) {
      return res.status(503).json({
        error: true,
        message: 'Firestore API is not enabled',
        details: 'Please enable Cloud Firestore API in Google Cloud Console',
        helpUrl: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=prasf-3c29f',
        instructions: 'Visit the link above and click "Enable", then wait 1-2 minutes and try again.'
      });
    }
    
    res.status(500).json({
      error: true,
      message: 'Error creating user document',
      details: error.message,
      code: error.code
    });
  }
}

