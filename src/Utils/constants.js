const host = window.location.hostname;
const defaultBaseUrl = `http://${host}:5000`;

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || defaultBaseUrl
).replace(/\/+$/, "");

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};