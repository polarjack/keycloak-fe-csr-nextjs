'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@/contexts/KeycloakContext';

interface DecodedToken {
  [key: string]: unknown;
  exp?: number;
}

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  };

  const isExpired = timeLeft <= 0;
  const isExpiringSoon = timeLeft > 0 && timeLeft <= 300; // 5 minutes

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm ${
        isExpired
          ? 'text-red-600 dark:text-red-400'
          : isExpiringSoon
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-green-600 dark:text-green-400'
      }`}>
        {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
      </span>
      {!isExpired && (
        <span className="text-xs text-foreground/60">
          until expiration
        </span>
      )}
    </div>
  );
}

function TokenDisplay({
  token,
  decodedToken,
  title
}: {
  token: string;
  decodedToken: DecodedToken | null;
  title: string;
}) {
  const renderTokenValue = (key: string, value: unknown): React.ReactElement => {
    const isExpField = key === 'exp';
    const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);

    if (isExpField && typeof value === 'number') {
      const date = new Date(value * 1000);
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1 inline-block">
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
            "{key}": {value}
          </span>
          <span className="text-foreground/60 text-xs ml-2">
            ({date.toLocaleString()})
          </span>
        </div>
      );
    }

    return <span className={isExpField ? 'font-semibold' : ''}>{`"${key}": ${valueStr}`}</span>;
  };

  const renderDecodedToken = (decoded: DecodedToken) => {
    const entries = Object.entries(decoded);

    return (
      <div className="space-y-1">
        <div className="text-foreground/70">{'{'}</div>
        {entries.map(([key, value], index) => (
          <div key={key} className="ml-4">
            {renderTokenValue(key, value)}
            {index < entries.length - 1 && ','}
          </div>
        ))}
        <div className="text-foreground/70">{'}'}</div>
      </div>
    );
  };

  return (
    <div className="bg-foreground/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {decodedToken?.exp && (
          <CountdownTimer expiresAt={decodedToken.exp} />
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2 text-foreground/80">Raw Token:</h3>
        <div className="bg-background border border-foreground/10 rounded p-4 overflow-x-auto">
          <code className="text-xs text-foreground/70 break-all">
            {token || 'No token available'}
          </code>
        </div>
      </div>

      {decodedToken && (
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground/80">Decoded Token:</h3>
          <div className="bg-background border border-foreground/10 rounded p-4 overflow-x-auto">
            <pre className="text-xs text-foreground/70">
              {renderDecodedToken(decodedToken)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { keycloak, authenticated, initialized, logout, refreshToken } = useKeycloak();
  const router = useRouter();
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [decodedRefreshToken, setDecodedRefreshToken] = useState<DecodedToken | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/signin');
    }
  }, [initialized, authenticated, router]);

  useEffect(() => {
    if (keycloak?.token) {
      try {
        const decoded = parseJwt(keycloak.token);
        setDecodedToken(decoded);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }

    if (keycloak?.refreshToken) {
      try {
        const decoded = parseJwt(keycloak.refreshToken);
        setDecodedRefreshToken(decoded);
      } catch (error) {
        console.error('Failed to decode refresh token:', error);
      }
    }
  }, [keycloak?.token, keycloak?.refreshToken]);

  const parseJwt = (token: string): DecodedToken => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  };

  const handleRefreshToken = async () => {
    setRefreshMessage('Refreshing token...');
    const refreshed = await refreshToken();
    if (refreshed) {
      setRefreshMessage('Token refreshed successfully!');
      setTimeout(() => setRefreshMessage(''), 3000);
    } else {
      setRefreshMessage('Failed to refresh token');
      setTimeout(() => setRefreshMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground/60">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Profile</h1>

        <div className="space-y-6">
          {/* User Actions */}
          <div className="bg-foreground/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={handleRefreshToken}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh Token
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
            {refreshMessage && (
              <p className="mt-4 text-sm text-foreground/80">{refreshMessage}</p>
            )}
          </div>

          {/* Access Token */}
          <TokenDisplay
            token={keycloak?.token || ''}
            decodedToken={decodedToken}
            title="Access Token"
          />

          {/* Refresh Token */}
          <TokenDisplay
            token={keycloak?.refreshToken || ''}
            decodedToken={decodedRefreshToken}
            title="Refresh Token"
          />
        </div>
      </div>
    </div>
  );
}
