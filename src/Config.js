import axios from "axios";

const host = window.location.hostname;
const defaultBaseUrl = `http://${host}:5000`;

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || defaultBaseUrl
).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});