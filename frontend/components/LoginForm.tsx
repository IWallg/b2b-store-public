"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await login(code);
      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Client Login</h1>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter client code"
        className="border px-4 py-2 rounded w-full mb-4"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Login
      </button>
    </form>
  );
}
