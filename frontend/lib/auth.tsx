"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loginClient } from "./api";

type ClientInfo = {
  clientId: string;
  name: string;
};

type AuthContextType = {
  token: string | null;
  client: ClientInfo | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);

  // Restore token + client on refresh
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedClient = localStorage.getItem("client");
    if (savedToken) setToken(savedToken);
    if (savedClient) setClient(JSON.parse(savedClient));
  }, []);

  async function login(code: string) {
    const { token, client } = await loginClient(code);
    setToken(token);
    setClient(client);
    localStorage.setItem("token", token);
    localStorage.setItem("client", JSON.stringify(client));
  }

  function logout() {
    setToken(null);
    setClient(null);
    localStorage.removeItem("token");
    localStorage.removeItem("client");
  }

  return (
    <AuthContext.Provider value={{ token, client, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}