/**
 * API Configuration
 * 
 * This file manages the backend API URL for the frontend.
 * 
 * DEFAULT: Uses deployed backend URL
 * 
 * To use a different URL (e.g., localhost for development):
 *   - Create .env file with: VITE_API_URL=http://localhost:4000
 */

// Deployed backend URL (DEFAULT)
const DEPLOYED_BACKEND_URL = 'https://smart-student-assistant-9p7y.onrender.com'

// Local backend URL (for development)
const LOCAL_BACKEND_URL = 'http://localhost:4000'

/**
 * Get the API URL based on environment configuration
 * @returns {string} The backend API URL
 */
export function getApiUrl() {
  // Check for explicit API URL from environment variable
  const envApiUrl = import.meta.env.VITE_API_URL
  
  if (envApiUrl) {
    // If explicitly set, use it
    console.log('Using configured API URL:', envApiUrl)
    return envApiUrl
  }

  // Default to deployed backend
  console.log('Using DEPLOYED backend:', DEPLOYED_BACKEND_URL)
  return DEPLOYED_BACKEND_URL
}

// Export URLs for reference
export { DEPLOYED_BACKEND_URL, LOCAL_BACKEND_URL }

// Note: Don't call getApiUrl() at module level
// Always call it inside components/functions to get the correct URL

