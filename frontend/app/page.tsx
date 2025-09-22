"use client";

import { useAuth } from "../lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { token } = useAuth();
  const router = useRouter();

  // Redirect based on auth status
  useEffect(() => {
    console.log("Auth token:", token);
    if (token) {
      console.log("Redirecting to /products");
      router.replace("/products");
    } else {
      router.replace("/login");
    }
  }, [token, router]);

  return null;
}
