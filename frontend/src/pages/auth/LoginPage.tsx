import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';
import '../../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { notifyError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      const message = 'Please fill in all fields';
      setError(message);
      notifyError(message);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      // If login is successful, navigate to the intended destination
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const message = getUserFriendlyErrorMessage(
        error,
        'Login failed. Please check your credentials.'
      );
      setError(message);
      notifyError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand-pane" aria-hidden="true">
          <p className="login-kicker">Initiate Platform</p>
          <h1>Welcome Back</h1>
          <p>
            Pick up your campaign where you left off. Your parties, encounters, and homebrew tools are ready.
          </p>
          <div className="login-orb login-orb-a" />
          <div className="login-orb login-orb-b" />
        </aside>

        <section className="login-form-pane">
          <div className="login-header">
            <h2>Sign in to your account</h2>
            <p>
              Or{' '}
              <Link to="/register" className="login-link-inline">
                create a new account
              </Link>
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={isLoading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
              />
            </div>

            <div className="login-meta-row">
              <label className="login-remember" htmlFor="remember-me">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="login-link-inline">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="login-submit"
            >
              {isLoading ? (
                <>
                  <svg className="login-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="login-demo-note">
            Demo account: admin@example.com / admin123
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;