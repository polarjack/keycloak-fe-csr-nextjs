'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import type Keycloak from 'keycloak-js';

interface KeycloakContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  initialized: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const KeycloakContext = createContext<KeycloakContextType>({
  keycloak: null,
  authenticated: false,
  initialized: false,
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
});

export const useKeycloak = () => useContext(KeycloakContext);

export function KeycloakProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);

        if (auth && keycloak.token) {
          // Set up token refresh
          const updateToken = () => {
            keycloak
              .updateToken(70)
              .then((refreshed) => {
                if (refreshed) {
                  console.log('Token refreshed');
                }
              })
              .catch(() => {
                console.error('Failed to refresh token');
                setAuthenticated(false);
              });
          };

          // Refresh token every 60 seconds
          const interval = setInterval(updateToken, 60000);
          return () => clearInterval(interval);
        }
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        setInitialized(true);
      });
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshed = await keycloak.updateToken(-1);
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  return (
    <KeycloakContext.Provider
      value={{
        keycloak,
        authenticated,
        initialized,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
}
