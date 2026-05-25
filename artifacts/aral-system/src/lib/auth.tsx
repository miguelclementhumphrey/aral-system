import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthUser, AuthResponse, useGetMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Setup token getter for Orval client
setAuthTokenGetter(() => localStorage.getItem("aral_token"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("aral_token"));
  const queryClient = useQueryClient();

  const { data: authResponse, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const user = authResponse?.user ?? null;
  const isProfileComplete = authResponse?.profileComplete ?? true;

  const login = (data: AuthResponse) => {
    localStorage.setItem("aral_token", data.token);
    setToken(data.token);
    queryClient.setQueryData(getGetMeQueryKey(), data);
  };

  const logout = () => {
    localStorage.removeItem("aral_token");
    setToken(null);
    queryClient.clear();
  };

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
