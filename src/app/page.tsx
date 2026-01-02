'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useKeycloak } from "@/contexts/KeycloakContext";

export default function Home() {
  const { authenticated, initialized, login, logout } = useKeycloak();
  const router = useRouter();

  useEffect(() => {
    if (initialized && authenticated) {
      router.push("/profile");
    }
  }, [initialized, authenticated, router]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-foreground">MPC MVP</h1>
        <p className="text-lg text-foreground/80">
          Multi-Party Computation MVP with Keycloak Authentication
        </p>

        {!initialized && (
          <p className="text-foreground/60">Initializing authentication...</p>
        )}

        {initialized && (
          <div className="flex flex-col gap-4 w-full max-w-md">
            {authenticated ? (
              <>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  You are signed in
                </p>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <Link
                    href="/profile"
                    className="rounded-lg border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-foreground/60">
                  Please sign in to access your profile
                </p>
                <button
                  onClick={login}
                  className="rounded-lg border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-foreground/60">
        <p>MPC MVP - Keycloak Authentication Demo</p>
      </footer>
    </div>
  );
}
