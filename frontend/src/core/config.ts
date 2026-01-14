// API Base URL - uses relative path by default (Vite proxy handles it)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000`;
