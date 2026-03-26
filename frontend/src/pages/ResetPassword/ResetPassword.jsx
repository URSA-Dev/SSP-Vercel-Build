import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './ResetPassword.module.css';

/* ── Inline SVG Icons ─────────────────────────────────────────────── */

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function AlertCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ── Password Strength ────────────────────────────────────────────── */

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { level: 'weak', label: 'Weak', color: 'var(--red)' };
  if (score <= 4) return { level: 'fair', label: 'Fair', color: 'var(--amber)' };
  return { level: 'strong', label: 'Strong', color: 'var(--green)' };
}

/* ── Component ────────────────────────────────────────────────────── */

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const passwordRef = useRef(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const strength = password ? getStrength(password) : null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password.');
      passwordRef.current?.focus();
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (strength?.level === 'weak') {
      setError('Please choose a stronger password. Use uppercase, lowercase, numbers, and symbols.');
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);

    // Mock — simulate network delay, always succeed
    await new Promise((r) => setTimeout(r, 1200));

    setLoading(false);
    setSuccess(true);
  }

  // Invalid / missing token state
  if (!token) {
    return (
      <div className={`${styles.page} ${styles.pageMounted}`}>
        <div className={styles.accent} aria-hidden="true">
          <div className={styles.accentInner}>
            <ShieldIcon className={styles.accentIcon} />
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.container}>
            <div className={styles.invalidBlock}>
              <div className={styles.invalidIconWrap}>
                <AlertCircleIcon className={styles.invalidIcon} />
              </div>
              <h2 className={styles.title}>Invalid Reset Link</h2>
              <p className={styles.subtitle}>
                This password reset link is invalid or has expired.
                Please request a new one.
              </p>
              <Link to="/forgot-password" className={styles.actionLink}>
                Request New Link
              </Link>
              <Link to="/login" className={styles.returnLink}>
                Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${mounted ? styles.pageMounted : ''}`}>
      <div className={styles.accent} aria-hidden="true">
        <div className={styles.accentInner}>
          <ShieldIcon className={styles.accentIcon} />
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.container}>
          <Link to="/login" className={`${styles.backLink} ${mounted ? styles.stagger1 : ''}`}>
            <ArrowLeftIcon className={styles.backLinkIcon} />
            <span>Back to Sign In</span>
          </Link>

          {success ? (
            /* ── Success State ─────────────────────────────── */
            <div className={`${styles.successBlock} ${styles.stagger1}`}>
              <div className={styles.successIconWrap}>
                <CheckCircleIcon className={styles.successIcon} />
              </div>
              <h2 className={styles.title}>Password Reset</h2>
              <p className={styles.subtitle}>
                Your password has been successfully reset.
                You can now sign in with your new password.
              </p>
              <Link to="/login" className={styles.signInBtn}>
                Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ────────────────────────────────── */
            <>
              <div className={`${styles.header} ${mounted ? styles.stagger2 : ''}`}>
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.subtitle}>
                  Choose a strong password for your account. Must be at
                  least 8 characters with a mix of letters, numbers, and symbols.
                </p>
              </div>

              {error && (
                <div className={styles.error} role="alert">
                  <span className={styles.errorText}>{error}</span>
                </div>
              )}

              <form className={`${styles.form} ${mounted ? styles.stagger3 : ''}`} onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reset-password">
                    New Password
                  </label>
                  <div className={styles.inputWrap}>
                    <LockIcon className={styles.inputIcon} />
                    <input
                      ref={passwordRef}
                      id="reset-password"
                      className={`${styles.input} ${styles.inputPassword} ${error ? styles.inputError : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOffIcon className={styles.toggleIcon} />
                        : <EyeIcon className={styles.toggleIcon} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password && strength && (
                    <div className={styles.strengthRow}>
                      <div className={styles.strengthTrack}>
                        <div
                          className={styles.strengthFill}
                          style={{
                            width: strength.level === 'weak' ? '33%' : strength.level === 'fair' ? '66%' : '100%',
                            background: strength.color,
                          }}
                        />
                      </div>
                      <span className={styles.strengthLabel} style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reset-confirm">
                    Confirm Password
                  </label>
                  <div className={styles.inputWrap}>
                    <LockIcon className={styles.inputIcon} />
                    <input
                      id="reset-confirm"
                      className={`${styles.input} ${styles.inputPassword} ${error ? styles.inputError : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirm
                        ? <EyeOffIcon className={styles.toggleIcon} />
                        : <EyeIcon className={styles.toggleIcon} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirm && (
                    <span
                      className={styles.matchHint}
                      style={{ color: password === confirm ? 'var(--green)' : 'var(--red)' }}
                    >
                      {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} aria-hidden="true" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>

              <div className={`${styles.footer} ${mounted ? styles.stagger4 : ''}`}>
                <span className={styles.footerText}>
                  URSA &copy; {new Date().getFullYear()} &middot; All rights reserved
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
