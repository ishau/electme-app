import { useQuery } from "@tanstack/react-query";
import { fetchUser, type AuthUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  } as {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
}
