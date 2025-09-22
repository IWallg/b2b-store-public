"use client";

import { useAuth } from "../lib/auth";
import { getProducts } from "../lib/api";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  retailPrice: number;
  availableStock: number;
  ean?: string;
  color?: string;
  imageUrl?: string | null;
}

export default function ProductList() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const data = await getProducts(token);
        const formatted = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          retailPrice: p.retailPrice ?? 0,
          availableStock: p.availableStock ?? 0,
          ean: p.ean,
          color: p.color,
          imageUrl: p.imageUrl,
        }));
        setProducts(formatted);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (!products.length) return <p>No products available.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <div
          key={p.id}
          className="border rounded-lg shadow-sm p-4 flex items-center hover:shadow-md transition"
        >
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-20 h-20 object-contain mr-4 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 mr-4 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded flex-shrink-0">
              No Image
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{p.name}</h2>
            <p className="text-gray-600 text-sm">{p.retailPrice.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">Stock: {p.availableStock}</p>
            {p.color && <p className="text-xs text-gray-500 break-words">Color: {p.color}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
