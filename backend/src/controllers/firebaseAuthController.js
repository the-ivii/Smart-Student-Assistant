import { adminAuth, adminDb } from '../config/firebase.js';

// Get user profile from Firestore
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

// Email validation function (backend)
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  // Trim and normalize
  email = email.trim().toLowerCase();
  
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Check basic format
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  // Check for valid domain
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  const domain = parts[1];
  const domainParts = domain.split('.');
  
  // Domain must have at least 2 parts
  if (domainParts.length < 2) {
    return { valid: false, message: 'Invalid email domain' };
  }
  
  // Check domain extension (TLD) is at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, message: 'Invalid email domain extension' };
  }
  
  // List of legitimate email providers (whitelist)
  const legitimateProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'yandex.com', 'zoho.com',
    'gmx.com', 'live.com', 'msn.com', 'rediffmail.com', 'sify.com',
    'example.com', 'test.com', 'company.com', 'business.com',
    // Educational domains
    'edu', 'ac.uk', 'edu.au', 'edu.in',
    // Common country-specific
    'co.uk', 'co.in', 'co.nz', 'co.za',
  ];
  
  // Check for common typos in popular email providers
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
  
  // Check if domain is a known typo
  if (commonTypos[domain]) {
    return { 
      valid: false, 
      message: `Did you mean ${parts[0]}@${commonTypos[domain]}? Please use a valid email address.` 
    };
  }
  
  // Extract base domain (without subdomains) for checking
  const baseDomain = domainParts.length >= 2 
    ? domainParts.slice(-2).join('.') 
    : domain;
  
  // Check if it's a legitimate provider
  const isLegitimateProvider = legitimateProviders.some(provider => {
    if (domain === provider || baseDomain === provider) return true;
    if (provider.startsWith('.') && domain.endsWith(provider)) return true;
    if (!provider.includes('.') && domain.endsWith('.' + provider)) return true;
    return false;
  });
  
  // If not a known provider, check if it looks legitimate
  if (!isLegitimateProvider) {
    const domainName = domainParts[0];
    
    // Allow corporate/educational domains but reject suspicious patterns
    if (domainName.length > 8) {
      const consonantCount = (domainName.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
      const vowelCount = (domainName.match(/[aeiou]/g) || []).length;
      
      // Very suspicious: no vowels and many consonants
      if (vowelCount === 0 && consonantCount > 8) {
        return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider like Gmail, Yahoo, or Outlook.' };
      }
      
      // Suspicious: very low vowel ratio
      if (domainName.length > 10 && vowelCount / domainName.length < 0.15) {
        return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider.' };
      }
    }
    
    // For unknown domains, require at least one vowel (most real domains have vowels)
    const domainNameLower = domainName.toLowerCase();
    if (domainName.length > 6 && !/[aeiou]/.test(domainNameLower)) {
      return { valid: false, message: 'Email domain appears to be invalid. Please use a legitimate email provider like Gmail, Yahoo, or Outlook.' };
    }
  }
  
  // Check for invalid patterns
  const invalidPatterns = [
    /^[^@]+@[^@]+@/,  // Multiple @ symbols
    /\.\./,           // Consecutive dots
    /^\./,            // Starts with dot
    /\.$/,            // Ends with dot
    /@\./,            // @ followed by dot
    /\.@/,            // Dot before @
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
  }
  
  // Check email length
  if (email.length > 254) {
    return { valid: false, message: 'Email address is too long' };
  }
  
  if (parts[0].length === 0 || parts[0].length > 64) {
    return { valid: false, message: 'Invalid email username' };
  }
  
  return { valid: true, normalizedEmail: email };
}

// Create or update user document in Firestore (called after signup)
export async function createUserDocument(req, res) {
  try {
    const { uid, username, email, displayName } = req.body;

    // Validate email format (backend validation)
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: true,
        message: emailValidation.message,
        details: 'Email validation failed on server'
      });
    }
    
    // Use normalized email
    const normalizedEmail = emailValidation.normalizedEmail;

    // Verify the token matches the uid
    if (req.firebaseUid !== uid) {
      return res.status(403).json({
        error: true,
        message: 'User ID mismatch'
      });
    }
    
    // Validate username
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

    // Check if user document already exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      // Document exists - don't update on login, only verify
      // Only update if called from signup (when username/email might be new)
      const existingData = userDoc.data();
      
      // Only update if email changed (shouldn't happen, but safety check)
      if (normalizedEmail && existingData.email !== normalizedEmail) {
        await adminDb.collection('users').doc(uid).update({
          email: normalizedEmail,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Updated email in Firestore user document for: ${uid}`);
      } else {
        console.log(`✅ Firestore user document exists for: ${uid} (no update needed)`);
      }
    } else {
      // Create new document (only for new signups or old users without documents)
      await adminDb.collection('users').doc(uid).set({
        username: username || normalizedEmail?.split('@')[0] || 'User',
        email: normalizedEmail,
        displayName: displayName || username || normalizedEmail?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        studyHistory: []
      });
      
      console.log(`✅ Created new Firestore user document for: ${uid}`);
    }

    res.json({
      success: true,
      message: 'User document created/updated successfully'
    });

  } catch (error) {
    console.error('Create user document error:', error);
    
    // Check if Firestore API is not enabled
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

