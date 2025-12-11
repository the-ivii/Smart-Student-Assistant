import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/Auth.module.css';
import { getApiUrl } from '../config/api';

export default function Login() {
  const navigate = useNavigate();
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError({ message: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    if (!formData.password || formData.password.length === 0) {
      setError({ message: 'Please enter your password.' });
      setLoading(false);
      return;
    }

    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      const token = data.token;
      const userInfo = data.user || {};

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email
      }));

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = err.message || 'Login failed. Please try again.';
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1 className={styles.title}>LOGIN</h1>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="email"
              placeholder="Enter username"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
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
                  <Link to="/signup" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    Click here to create an account
                  </Link>
                </div>
              )}
              {error.showTip && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Tip: Make sure Email/Password is enabled in Firebase Console (Authentication &gt; Sign-in method)
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

          <Link to="/forgot-password" className={styles.link}>Forgot Password?</Link>

          <div className={styles.divider}></div>

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.link}>Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

