import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    const storedToken = localStorage.getItem("cbt_token");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
    setAuthChecked(true);
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem("cbt_token", newToken);
    setToken(newToken);
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Gagal logout di server");
      }
    }
    localStorage.removeItem("cbt_token");
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        token,
        showLogin,
        setShowLogin,
        authChecked,
        login,
        logout,
        loading,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
