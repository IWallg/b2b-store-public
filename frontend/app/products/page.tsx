"use client";

import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProductList from "../../components/ProductList";

export default function ProductsPage() {
  const { token, client, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">
          Logout
        </button>
        {client && (
          <h1 className="text-xl font-semibold text-gray-800">
            Welcome, {client.name}
          </h1>
        )}
      </div>

      <ProductList />
    </div>
  );
}
