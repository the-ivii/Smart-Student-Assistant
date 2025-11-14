const DEPLOYED_BACKEND_URL = 'https://smart-student-assistant-9p7y.onrender.com'

const LOCAL_BACKEND_URL = 'http://localhost:4000'

export function getApiUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL
  
  if (envApiUrl) {
    console.log('Using configured API URL:', envApiUrl)
    return envApiUrl
  }

  console.log('Using DEPLOYED backend:', DEPLOYED_BACKEND_URL)
  return DEPLOYED_BACKEND_URL
}

export { DEPLOYED_BACKEND_URL, LOCAL_BACKEND_URL }
