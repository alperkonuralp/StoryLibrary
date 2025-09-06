'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, BookOpen, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms of service');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Registration successful, redirect to home or dashboard
        router.push('/');
      } else {
        setError(data.error?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const passwordStrength = {
    score: 0,
    feedback: [] as string[]
  };

  // Simple password strength calculation
  if (formData.password) {
    if (formData.password.length >= 6) passwordStrength.score++;
    if (formData.password.length >= 10) passwordStrength.score++;
    if (/[A-Z]/.test(formData.password)) passwordStrength.score++;
    if (/[0-9]/.test(formData.password)) passwordStrength.score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) passwordStrength.score++;

    if (formData.password.length < 6) passwordStrength.feedback.push('At least 6 characters');
    if (passwordStrength.score < 3) passwordStrength.feedback.push('Add uppercase letters, numbers, or symbols');
  }

  const strengthColors = {
    0: 'bg-red-200',
    1: 'bg-red-400',
    2: 'bg-yellow-400',
    3: 'bg-blue-400',
    4: 'bg-green-400',
    5: 'bg-green-600'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Story Library</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our community and start your language learning journey
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create a new account to access our story collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.score
                              ? strengthColors[passwordStrength.score as keyof typeof strengthColors]
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-gray-600">
                        {passwordStrength.feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password && (
                  <div className="mt-1 flex items-center space-x-1">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <span className="text-xs text-red-600">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-top space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptTerms: e.target.checked })
                  }
                />
                <div className="text-sm">
                  <Label htmlFor="acceptTerms" className="cursor-pointer">
                    I agree to the{' '}
                    <button 
                      type="button"
                      className="text-blue-600 hover:text-blue-500" 
                      onClick={() => alert('Terms of Service page coming soon!')}
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button 
                      type="button"
                      className="text-blue-600 hover:text-blue-500"
                      onClick={() => alert('Privacy Policy page coming soon!')}
                    >
                      Privacy Policy
                    </button>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.acceptTerms}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-2 text-center text-sm">
              <div>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </Link>
              </div>
              <div className="pt-4 border-t">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-500"
                >
                  ← Back to stories
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}