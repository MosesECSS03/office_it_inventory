// API Configuration
// Centralized configuration for backend API endpoints

const getBaseURL = () => {
  const isLocalhost = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" ||
                     window.location.hostname === "0.0.0.0";
  
  const baseURL = isLocalhost 
    ? "http://localhost:3001" 
    : "https://ecss-it-inventory-backend.azurewebsites.net";
  
  console.log('API Config - Current environment:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    isLocalhost,
    baseURL
  });
  
  return baseURL;
};

export const API_BASE_URL = getBaseURL();

// Socket.IO configuration
export const SOCKET_CONFIG = {
  url: API_BASE_URL,
  options: {
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  }
};

export default {
  BASE_URL: API_BASE_URL,
  SOCKET_CONFIG
};
