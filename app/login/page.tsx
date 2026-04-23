'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/AuthContext';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/sales');
  }, [isLoading, user, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { token } = await apiClient.register({ name, email, password });
        apiClient.setToken(token);
        await login({ email, password });
      } else {
        await login({ email, password });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">B2B Training</span>
          </div>
          <p className="text-gray-600">AI-powered English training for corporate teams</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create account
              </button>
            </div>
            <CardTitle className="mt-4 text-lg">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                />
                {mode === 'register' && (
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? mode === 'register' ? 'Creating account…' : 'Signing in…'
                  : mode === 'register' ? 'Create account' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
