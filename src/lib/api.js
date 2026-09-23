export async function api(path, options = {}) {
  let response;
  try {
    const csrfToken = document.cookie.split('; ').find(part => part.startsWith('csrftoken='))?.split('=')[1];
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(csrfToken && { 'X-CSRFToken': decodeURIComponent(csrfToken) }), ...options.headers },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the Python backend is running.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
