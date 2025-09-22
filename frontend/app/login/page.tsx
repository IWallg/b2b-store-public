"use client";

import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push("/products");
    }
  }, [token, router]);

  if (token) return null;

  return (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <LoginForm />
    </div>
  );
}
