const BASE_URL = 'http://localhost:3001/api';

export async function loginRequest(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data; // { token, user: { id, name, email, role } }
}

export async function getMeRequest(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const me = await res.json();

  // Normalize DB column names to match the login response shape
  return {
    id:          me.UserID,
    name:        `${me.FirstName} ${me.LastName}`,
    email:       me.Email,
    role:        me.Role,
    warehouseId: me.warehouseId || null,
  };
}
