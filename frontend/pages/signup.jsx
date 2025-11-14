import { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import styles from '../styles/Auth.module.css';
import { getApiUrl } from '../src/config/api';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Email validation function
  const validateEmail = (email) => {
    // Trim whitespace
    email = email.trim();
    
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Check basic format
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address (e.g., user@example.com)' };
    }
    
    // Check for valid domain (must have at least one dot after @)
    const parts = email.split('@');
    if (parts.length !== 2) {
      return { valid: false, message: 'Invalid email format' };
    }
    
    const domain = parts[1].toLowerCase();
    const domainParts = domain.split('.');
    
    // Domain must have at least 2 parts (e.g., example.com, not just "com")
    if (domainParts.length < 2) {
      return { valid: false, message: 'Email domain must be valid (e.g., @gmail.com, @example.com)' };
    }
    
    // Check domain extension (TLD) is at least 2 characters
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return { valid: false, message: 'Email must have a valid domain extension (e.g., .com, .org)' };
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
      // Corporate domains (we'll allow any .com, .org, .net, etc. for business emails)
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
      // Exact match
      if (domain === provider || baseDomain === provider) return true;
      // For providers like .edu, check if TLD matches
      if (provider.startsWith('.') && domain.endsWith(provider)) return true;
      // For providers without TLD, check if domain ends with it
      if (!provider.includes('.') && domain.endsWith('.' + provider)) return true;
      return false;
    });
    
    // If not a known provider, check if it looks legitimate
    if (!isLegitimateProvider) {
      const domainName = domainParts[0];
      
      // Allow corporate/educational domains (must have proper structure)
      // But reject suspicious patterns
      if (domainName.length > 8) {
        const consonantCount = (domainName.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
        const vowelCount = (domainName.match(/[aeiouAEIOU]/g) || []).length;
        
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
    
    // Check for common invalid patterns
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
        return { valid: false, message: 'Invalid email format detected' };
      }
    }
    
    // Check email length (reasonable limits)
    if (email.length > 254) {
      return { valid: false, message: 'Email address is too long (max 254 characters)' };
    }
    
    if (parts[0].length === 0) {
      return { valid: false, message: 'Email must have a username before @' };
    }
    
    if (parts[0].length > 64) {
      return { valid: false, message: 'Email username is too long (max 64 characters)' };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trim email
    const trimmedEmail = formData.email.trim();
    
    // Validate email format
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.message);
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    // Additional username validation
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);

    try {
      // Create user with Firebase Auth (use trimmed email)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail.toLowerCase(), // Normalize to lowercase
        formData.password
      );

      const user = userCredential.user;
      console.log('Firebase Auth user created:', user.uid);

      const token = await user.getIdToken();
      console.log('Firebase token obtained');

      // Create user document in Firestore via backend (bypasses security rules)
      const API_URL = getApiUrl();
      try {
        const response = await fetch(`${API_URL}/api/firebase/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: user.uid,
            username: formData.username,
            email: trimmedEmail.toLowerCase(), // Use normalized email
            displayName: formData.username
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Firestore user document created via backend:', data.message);
        } else {
          const errorData = await response.json();
          console.error('Backend Firestore error:', errorData);
          
          if (errorData.details?.includes('Firestore API') || errorData.details?.includes('SERVICE_DISABLED')) {
            console.warn('Firestore API not enabled. User will be created on first login.');
            console.warn('Enable it here:', errorData.helpUrl || 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=prasf-3c29f');
          } else {
            // Try frontend Firestore as fallback
            try {
              await setDoc(doc(db, 'users', user.uid), {
                username: formData.username,
                email: trimmedEmail.toLowerCase(), // Use normalized email
                displayName: formData.username,
                createdAt: new Date().toISOString(),
                studyHistory: []
              });
              console.log('Firestore user document created via frontend fallback');
            } catch (fallbackError) {
              console.error('Frontend Firestore fallback also failed:', fallbackError);
              console.warn('User is authenticated but Firestore document will be created on first login');
            }
          }
        }
      } catch (backendError) {
        console.error('Backend request failed, trying frontend Firestore:', backendError);
        try {
          await setDoc(doc(db, 'users', user.uid), {
            username: formData.username,
            email: trimmedEmail.toLowerCase(),
            displayName: formData.username,
            createdAt: new Date().toISOString(),
            studyHistory: []
          });
          console.log('Firestore user document created via frontend fallback');
        } catch (fallbackError) {
          console.error('Frontend Firestore fallback also failed:', fallbackError);
          // Continue anyway - user is authenticated, document can be created on login
        }
      }

      // Store user data and token
      const userInfo = {
        uid: user.uid,
        email: user.email,
        username: formData.username,
        displayName: formData.username
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('firebaseUid', user.uid);
      
      console.log('User data stored, redirecting...');
      
      // Clear loading state before redirect
      setLoading(false);
      
      // Redirect to home page with a small delay to ensure state is updated
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (err) {
      console.error('Signup error:', err);
      setLoading(false);
      let errorMessage = 'Signup failed. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.title}>SIGN UP</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>👤</span>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>✉️</span>
            <input
              type="email"
              name="email"
              placeholder="E-mail (e.g., user@example.com)"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
              title="Please enter a valid email address"
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>

          <div className={styles.divider}></div>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <a href="/login" className={styles.link}>Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
}

