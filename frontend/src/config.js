// API configuration
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://YOUR_BACKEND_DOMAIN.vercel.app' // Replace with actual backend URL
    : 'http://localhost:5000'),
  ENVIRONMENT: process.env.NODE_ENV || 'development'
};

export default config;