'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from './auth-provider';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({
  mode,
}: AuthFormProps) {
  const router = useRouter();

  const {
    user,
    isLoading,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isRegister = mode === 'register';

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/projects');
    }
  }, [isLoading, router, user]);

  async function handleSubmit(
    event: SubmitEvent,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
        });
      } else {
        await login({
          email,
          password,
        });
      }

      router.replace('/projects');
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError(
          'Unable to connect to the server',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) {
    return <AuthLoading />;
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-mark">SF</span>
          <span>SiteFlow</span>
        </div>

        <div className="auth-visual-content">
          <span className="eyebrow">
            Construction management
          </span>

          <h1>
            Keep every site issue under control
          </h1>

          <p>
            Record defects, assign responsible
            team members, and track progress
            from one workspace.
          </p>

          <div className="feature-list">
            <span>Projects and teams</span>
            <span>Buildings and floors</span>
            <span>Photos and documents</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="mobile-brand">
              SiteFlow
            </span>

            <h2>
              {isRegister
                ? 'Create your account'
                : 'Welcome back'}
            </h2>

            <p>
              {isRegister
                ? 'Enter your details to get started'
                : 'Sign in to continue to SiteFlow'}
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {isRegister && (
              <label>
                <span>Name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Alexander"
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              <span>Email</span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="At least 8 characters"
                minLength={8}
                autoComplete={
                  isRegister
                    ? 'new-password'
                    : 'current-password'
                }
                required
              />
            </label>

            {error && (
              <div
                className="form-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Please wait...'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister
              ? 'Already have an account?'
              : 'New to SiteFlow?'}

            {' '}

            <Link
              href={
                isRegister
                  ? '/login'
                  : '/register'
              }
            >
              {isRegister
                ? 'Sign in'
                : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function AuthLoading() {
  return (
    <main className="page-loading">
      <div className="spinner" />
      <span>Loading...</span>
    </main>
  );
}