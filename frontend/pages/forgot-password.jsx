import { useState } from 'react';
import { useRouter } from 'next/router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from '../styles/Auth.module.css';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      console.log('✅ Password reset email sent to:', email);
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <div className={styles.iconContainer}>
          <div className={styles.userIcon}>🔐</div>
        </div>
        <h1 className={styles.title}>RESET PASSWORD</h1>
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--color-text-secondary)', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {success ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '2px solid var(--color-success)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>
              Password Reset Email Sent!
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Check your email ({email}) for a password reset link.
              <br />
              The link will expire in 1 hour.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--color-primary)'}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>✉️</span>
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChange={handleChange}
                required
                className={styles.input}
                disabled={loading}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button 
              type="submit" 
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>

            <div className={styles.divider}></div>

            <p className={styles.switchText}>
              Remember your password?{' '}
              <a href="/login" className={styles.link}>Login here</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

