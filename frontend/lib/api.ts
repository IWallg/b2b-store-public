const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071";

// Login request: returns { token, client }
export async function loginClient(code: string) {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await res.json(); // parse JSON

  if (!res.ok) {
    if (res.status === 401 && data.error === "Inactive client") {
      throw new Error("Client is inactive");
    } else if (res.status === 401) {
      throw new Error("Invalid login code");
    } else {
      throw new Error(data.error || "Login failed");
    }
  }

  return data;
}

// Fetch products for a client
export async function getProducts(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}
