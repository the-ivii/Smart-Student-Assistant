/**
 * API Configuration
 * 
 * This file manages the backend API URL for the frontend.
 * 
 * DEFAULT: Always uses localhost backend URL
 * 
 * To use a different URL:
 *   - Create .env file with: VITE_API_URL=http://your-backend-url:4000
 */

// Local backend URL (DEFAULT)
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

  // Default to localhost backend
  console.log('Using LOCALHOST backend:', LOCAL_BACKEND_URL)
  return LOCAL_BACKEND_URL
}

// Export URL for reference
export { LOCAL_BACKEND_URL }

// Note: Don't call getApiUrl() at module level
// Always call it inside components/functions to get the correct URL

