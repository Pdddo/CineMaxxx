const BASE_URL = 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requireAuth = true, headers, ...customConfig } = options;

  const token = localStorage.getItem('access_token');
  
  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
    },
  };

  // Only set Content-Type to application/json if it's not FormData
  if (!(customConfig.body instanceof FormData)) {
    (config.headers as Record<string, string>)['Content-Type'] = 
      (headers as Record<string, string>)?.['Content-Type'] || 'application/json';
  } else {
    // If it is FormData, we don't set Content-Type, let the browser set it with the correct boundary
    if (config.headers && 'Content-Type' in (config.headers as Record<string, string>)) {
       delete (config.headers as Record<string, string>)['Content-Type'];
    }
  }

  if (requireAuth && token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
}
