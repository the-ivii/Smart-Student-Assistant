import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import StudyForm from '../components/StudyForm'
import StudyResults from '../components/StudyResults'
import ThemeToggle from '../components/ThemeToggle'
import History from '../components/History'
import LandingPage from '../components/LandingPage'
import { getApiUrl } from '../src/config/api'

export default function Home() {
  const router = useRouter()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [user, setUser] = useState(null)
  const [showLanding, setShowLanding] = useState(true)

  // Get API URL from centralized config
  // Default: Uses localhost backend (http://localhost:4000)
  // To use localhost for testing: Create .env.local with NEXT_PUBLIC_USE_LOCALHOST=true
  const FINAL_API_URL = getApiUrl()

  // Fetch history from Firestore/MongoDB
  const fetchHistory = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FINAL_API_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Sort by timestamp descending
          const sortedHistory = (data.history || []).sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          )
          setHistory(sortedHistory)
        }
      }
    } catch (err) {
      // Silently fail - backend might not be running
      // Only log if it's not a connection/abort error
      if (
        !err.message?.includes('Failed to fetch') && 
        !err.message?.includes('ERR_CONNECTION_REFUSED') &&
        err.name !== 'AbortError'
      ) {
        console.error('Error fetching history:', err)
      }
      // Fallback to localStorage if backend is down
      const savedHistory = localStorage.getItem('studyHistory')
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  // Load user and fetch history from MongoDB if logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        // Fetch history from MongoDB
        fetchHistory()
      } catch (e) {
        console.error('Failed to load user:', e)
      }
    } else {
      // Fallback to localStorage for non-logged-in users
      const savedHistory = localStorage.getItem('studyHistory')
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error('Failed to load history:', e)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    // If using Firebase, sign out
    const firebaseUid = localStorage.getItem('firebaseUid')
    if (firebaseUid) {
      try {
        const { signOut } = await import('firebase/auth')
        const { auth } = await import('../lib/firebase')
        await signOut(auth)
      } catch (err) {
        console.error('Firebase signout error:', err)
      }
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('firebaseUid')
    setUser(null)
    router.push('/login')
  }

  const handleSubmit = async (topic, mode) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add auth token if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(
        `${FINAL_API_URL}/study?topic=${encodeURIComponent(topic)}&mode=${mode}`,
        { 
          headers,
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch study materials')
      }

      // Ensure mode is included in results
      setResults({
        ...data,
        mode: mode || data.mode || 'normal'
      })
      setShowLanding(false) // Hide landing page when results are shown

      // Refresh history from MongoDB if logged in, otherwise use localStorage
      if (token) {
        // Don't await - let it happen in background
        fetchHistory().catch(() => {
          // Silently fail - backend might be down
        })
      } else {
        // Fallback to localStorage for non-logged-in users
        const newHistoryItem = {
          id: Date.now(),
          topic: data.topic || topic,
          mode,
          timestamp: new Date().toISOString(),
        }
        const updatedHistory = [newHistoryItem, ...history].slice(0, 10)
        setHistory(updatedHistory)
        localStorage.setItem('studyHistory', JSON.stringify(updatedHistory))
      }

    } catch (err) {
      console.error('Error fetching study materials:', err)
      
      // Better error messages
      let errorMessage = 'Failed to fetch study materials'
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond. Please try again.'
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED') || err.message?.includes('NetworkError')) {
        errorMessage = `Cannot connect to backend server at ${FINAL_API_URL}. Please check if the backend is deployed and running.`
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (topic, mode) => {
    handleSubmit(topic, mode)
  }

  const clearHistory = async () => {
    const token = localStorage.getItem('token')
    
    if (token) {
      // Clear from MongoDB
      try {
        const response = await fetch(`${FINAL_API_URL}/api/history`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setHistory([])
        } else {
          console.error('Failed to clear history')
        }
      } catch (err) {
        console.error('Error clearing history:', err)
      }
    } else {
      // Fallback to localStorage
      setHistory([])
      localStorage.removeItem('studyHistory')
    }
  }

  const deleteHistoryItem = async (itemId) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      // Delete from MongoDB
      try {
        const response = await fetch(`${FINAL_API_URL}/api/history/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          // Refresh history
          await fetchHistory()
        } else {
          console.error('Failed to delete history item')
        }
      } catch (err) {
        console.error('Error deleting history item:', err)
      }
    } else {
      // Fallback to localStorage
      const updatedHistory = history.filter(item => item.id !== itemId)
      setHistory(updatedHistory)
      localStorage.setItem('studyHistory', JSON.stringify(updatedHistory))
    }
  }

  return (
    <>
      <Head>
        <title>Smart Study Assistant - AI-Powered Learning</title>
        <meta name="description" content="Learn smarter with AI-powered summaries, quizzes, and study tips" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {showLanding && !results ? (
        <LandingPage onGetStarted={() => {
          setShowLanding(false)
          setResults(null) // Ensure results are cleared
        }} />
      ) : (
        <div className="container">
          {/* Top Navigation Bar - Left: Back to Home */}
          {/* Show button when we have results or when not on landing page */}
          {(results || !showLanding) && (
            <div style={{ 
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 10
            }}>
              <button
                onClick={() => {
                  setShowLanding(true)
                  setResults(null) // Clear results when going back to home
                  setError(null) // Clear any errors
                }}
                className="landing-nav-button"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '2px solid var(--color-text)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  transition: 'var(--transition)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--color-text)';
                  e.target.style.color = 'var(--color-bg)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--color-bg)';
                  e.target.style.color = 'var(--color-text)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🏠 Home
              </button>
            </div>
          )}
          
          {/* Top Navigation Bar - Right: User Info and Theme Toggle */}
          <div style={{ 
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            {user ? (
              <>
                <span style={{ 
                  color: 'var(--color-text)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="landing-nav-button"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--color-text)',
                    color: 'var(--color-bg)',
                    border: '2px solid var(--color-text)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    transition: 'var(--transition)',
                    textDecoration: 'none',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--color-bg)';
                    e.target.style.color = 'var(--color-text)';
                    e.target.style.borderColor = 'var(--color-text)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--color-text)';
                    e.target.style.color = 'var(--color-bg)';
                    e.target.style.borderColor = 'var(--color-text)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="landing-nav-button secondary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid #B899D6',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'var(--transition)',
                    display: 'inline-block',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(184, 153, 214, 0.2)';
                    e.target.style.borderColor = '#8A6FA0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = '#B899D6';
                  }}
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="landing-nav-button primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#B899D6',
                    color: '#271E37',
                    border: 'none',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'var(--transition)',
                    display: 'inline-block',
                    boxShadow: '0 4px 15px rgba(184, 153, 214, 0.3)',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#8A6FA0';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(184, 153, 214, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#B899D6';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(184, 153, 214, 0.3)';
                  }}
                >
                  Sign Up
                </a>
              </>
            )}
            <ThemeToggle />
          </div>
          
          <header className="header" style={{ marginTop: '0rem', padding: '0 2rem', borderBottom: '3px solid var(--color-text)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <h1 className="title" style={{ fontSize: '3rem', letterSpacing: '-0.02em', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
              Smart Study Assistant
            </h1>
            <p className="subtitle" style={{ fontSize: '1rem', opacity: 0.8, fontWeight: '400' }}>
              AI-Powered Learning Made Simple
            </p>
          </header>

          <main className="main">
            <StudyForm onSubmit={handleSubmit} loading={loading} />

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Generating your study materials...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <div>
                  <h3>Oops! Something went wrong</h3>
                  <p>{error}</p>
                  {error.includes('Cannot connect to backend') && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      Backend URL: <code style={{ background: 'var(--color-bg)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>{FINAL_API_URL}</code>
                      <br />
                      {FINAL_API_URL.includes('localhost') ? (
                        <>If running locally, start backend: <code style={{ background: 'var(--color-bg)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>cd backend && npm run dev</code></>
                      ) : (
                        <>The backend should be deployed and accessible. If issues persist, check the deployment status.</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {results && !loading && <StudyResults data={results} />}

            {history.length > 0 && (
              <History 
                history={history} 
                onHistoryClick={handleHistoryClick}
                onClear={clearHistory}
                onDelete={deleteHistoryItem}
              />
            )}
          </main>

        </div>
      )}
    </>
  )
}

