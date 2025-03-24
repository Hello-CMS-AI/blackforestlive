import axios from 'axios';

// Create an Axios instance with default configuration
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://159.89.163.222/api', // Use environment variable for baseURL
});

export default API;
