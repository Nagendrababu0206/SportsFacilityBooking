const trimTrailingSlash = (value) => value ? value.replace(/\/$/, '') : '';

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';

  const { protocol, hostname, port } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost && port === '5173') {
    return `${protocol}//${hostname}:5001`;
  }

  return window.location.origin;
};

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()
);
