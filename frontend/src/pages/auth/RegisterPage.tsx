import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';
import styles from './LoginPage.module.css';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      const message = 'Passwords do not match.';
      setError(message);
      notifyError(message);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        password_confirm: form.confirmPassword,
        first_name: form.firstName,
        last_name: form.lastName,
      });

      notifySuccess('Account created successfully. Welcome to Initiate!');
      navigate('/dashboard', { replace: true });
    } catch (submitError: unknown) {
      const message = getUserFriendlyErrorMessage(submitError, 'Failed to create account.');
      setError(message);
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['login-page']}>
      <div className={[styles['login-shell'], styles['register-shell']].filter(Boolean).join(' ')}>
        <aside className={styles['login-brand-pane']} aria-hidden="true">
          <p className={styles['login-kicker']}>Initiate Platform</p>
          <h1>Create Your Account</h1>
          <p>
            Build characters, join campaigns, and manage encounters in one place.
          </p>
          <div className={[styles['login-orb'], styles['login-orb-a']].filter(Boolean).join(' ')} />
          <div className={[styles['login-orb'], styles['login-orb-b']].filter(Boolean).join(' ')} />
        </aside>

        <section className={[styles['login-form-pane'], styles['register-form-pane']].filter(Boolean).join(' ')}>
          <div className={styles['login-header']}>
            <h2>Create your account</h2>
            <p>
              Or{' '}
              <Link to="/login" className={styles['login-link-inline']}>
                sign in to existing account
              </Link>
            </p>
          </div>

          {error && (
            <div className={styles['login-error']} role="alert">
              {error}
            </div>
          )}

          <form className={[styles['login-form'], styles['register-form']].filter(Boolean).join(' ')} onSubmit={handleSubmit}>
            <div className={styles['login-field']}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles['login-field']}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles['register-name-grid']}>
              <div className={styles['login-field']}>
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles['login-field']}>
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles['login-field']}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles['login-field']}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                disabled={isSubmitting}
              />
            </div>

            <button type="submit" className={styles['login-submit']} disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className={styles['login-demo-note']}>
            Create an account to start building characters and joining campaigns.
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;