import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import styles from '../styles/Auth.module.css';
import { getApiUrl } from '../src/config/api';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError({ message: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    // Validate password is not empty
    if (!formData.password || formData.password.length === 0) {
      setError({ message: 'Please enter your password.' });
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign in with email:', formData.email);
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const user = userCredential.user;
      console.log('✅ Firebase Auth successful:', user.uid);

      // Get Firebase ID token first (needed for backend API call)
      const token = await user.getIdToken();
      console.log('✅ Firebase token obtained');

      // Get user data from Firestore (READ ONLY - don't create/update on login)
      let userData = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
          console.log('✅ Firestore user document found and verified');
          
          // Verify email matches (security check)
          if (userData.email && userData.email !== user.email) {
            console.warn('⚠️ Email mismatch between Auth and Firestore');
          }
        } else {
          // Only create if document doesn't exist (for users who signed up before Firestore was set up)
          console.log('⚠️ Firestore user document not found, creating it for existing user...');
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
                username: user.email?.split('@')[0] || 'User',
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User'
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Firestore user document created for existing user:', data.message);
              // Fetch the newly created document
              const newUserDoc = await getDoc(doc(db, 'users', user.uid));
              if (newUserDoc.exists()) {
                userData = newUserDoc.data();
              } else {
                userData = {
                  username: user.email?.split('@')[0] || 'User',
                  email: user.email,
                  displayName: user.displayName || user.email?.split('@')[0] || 'User'
                };
              }
            } else {
              // If backend fails, use minimal data from Auth
              console.warn('⚠️ Could not create Firestore document, using Auth data');
              userData = {
                username: user.email?.split('@')[0] || 'User',
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User'
              };
            }
          } catch (backendError) {
            console.error('⚠️ Backend creation failed:', backendError);
            // Use minimal data from Auth
            userData = {
              username: user.email?.split('@')[0] || 'User',
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User'
            };
          }
        }
      } catch (firestoreError) {
        console.error('⚠️ Firestore read error (continuing anyway):', firestoreError);
        // Use minimal data from Auth if Firestore fails
        userData = {
          username: user.email?.split('@')[0] || 'User',
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User'
        };
      }

      // Store user data and token
      const userInfo = {
        uid: user.uid,
        email: user.email,
        username: userData?.username || user.email?.split('@')[0] || 'User',
        displayName: userData?.displayName || user.displayName || user.email?.split('@')[0] || 'User'
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('firebaseUid', user.uid);
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Login failed. Please try again.';
      let showSignupLink = false;
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
        showSignupLink = true;
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please check your password and try again.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. This usually means: 1) The account doesn\'t exist (sign up first), or 2) Email/Password auth is not enabled in Firebase Console.';
        showSignupLink = true;
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = `${err.message} (Code: ${err.code || 'unknown'})`;
      }
      
      setError({
        message: errorMessage,
        showSignupLink,
        showTip: err.code === 'auth/invalid-credential'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <div className={styles.iconContainer}>
          <div className={styles.userIcon}>👤</div>
        </div>
        <h1 className={styles.title}>LOGIN</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>👤</span>
            <input
              type="text"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
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
              className={styles.input}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input type="checkbox" id="remember" className={styles.checkbox} />
            <label htmlFor="remember" className={styles.checkboxLabel}>Remember me</label>
          </div>

          {error && (
            <div className={styles.error}>
              <div style={{ marginBottom: '0.5rem' }}>{error.message || error}</div>
              {error.showSignupLink && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <a href="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    Click here to create an account
                  </a>
                </div>
              )}
              {error.showTip && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  💡 Tip: Make sure Email/Password is enabled in Firebase Console (Authentication &gt; Sign-in method)
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <a href="/forgot-password" className={styles.link}>Forgot Password?</a>

          <div className={styles.divider}></div>

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <a href="/signup" className={styles.link}>Sign up here</a>
          </p>
        </form>
      </div>
    </div>
  );
}

