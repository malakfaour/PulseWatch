import { useEffect, useState } from "react";

const STORAGE_KEY = "pulsewatch_token";

export default function useAuth() {
  const [token, setTokenState] = useState(() => window.localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  return {
    token,
    setToken: setTokenState,
    clearToken: () => setTokenState(""),
  };
}
