import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginPage() {
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Must be a valid email';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
    }
    return null;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      const firstField = emailError ? 'email' : 'password';
      document.querySelector(`[name="${firstField}"]`)?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      setServerError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-bg-surface border border-border-card rounded-md p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-7">
            Sign in to Demo Day
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleBlur}
              error={errors.email}
              placeholder="admin@demoday.com"
              autoComplete="off"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
              error={errors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            {serverError && (
              <p className="text-xs text-red-500" role="alert">
                {serverError}
              </p>
            )}

            <div className="mt-2">
              <Button type="submit" isLoading={isLoading} className="w-full">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
