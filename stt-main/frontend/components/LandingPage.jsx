import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage({ onGetStarted }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    }
  }, []);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-nav">
        {user ? (
          <div className="landing-nav-user">
            <span className="landing-nav-username">{user.username}</span>
            <button
              className="landing-nav-button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="landing-nav-buttons">
            <button onClick={() => navigate('/login')} className="landing-nav-button secondary">
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="landing-nav-button primary">
              Sign Up
            </button>
          </div>
        )}
      </div>
      <div className="landing-hero">
        <div className="landing-content">
          <h1 className="landing-title">
            Your Personal Learning Companion
          </h1>
          <p className="landing-subtitle">
            Master Any Subject with Intelligent Study Tools
          </p>
          <p className="landing-description">
            Discover a revolutionary approach to learning. Our platform creates custom study materials 
            from any topic, helping you understand complex concepts through structured summaries, 
            practice questions, and strategic learning guidance.
          </p>
          
          <div className="landing-features">
            <div className="feature-card">
              <h3>Topic Breakdown</h3>
              <p>Break down complex subjects into digestible key points and essential information</p>
            </div>
            <div className="feature-card">
              <h3>Practice Questions</h3>
              <p>Reinforce your understanding with tailored multiple-choice questions and detailed explanations</p>
            </div>
            <div className="feature-card">
              <h3>Learning Strategies</h3>
              <p>Get actionable advice and proven techniques to enhance your study efficiency</p>
            </div>
            <div className="feature-card">
              <h3>Problem Solving</h3>
              <p>Tackle mathematical and logical challenges with comprehensive step-by-step guidance</p>
            </div>
          </div>

          <div className="landing-actions">
            {user ? (
              <button className="landing-button primary" onClick={handleGetStarted}>
                Start Learning Now
              </button>
            ) : (
              <>
                <button className="landing-button primary" onClick={() => navigate('/signup')}>
                  Create Account
                </button>
                <button className="landing-button secondary" onClick={() => navigate('/login')}>
                  Login
                </button>
              </>
            )}
          </div>

          <div className="landing-stats">
            <div className="stat-item">
              <div className="stat-number">Unlimited</div>
              <div className="stat-label">Study Topics</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Instant</div>
              <div className="stat-label">Content Generation</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Advanced</div>
              <div className="stat-label">AI Technology</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

