import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ForgotPassword.module.css';

/* ── Inline SVG Icons ─────────────────────────────────────────────── */

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
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

function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
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

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────────────── */

export default function ForgotPassword() {
  const emailRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      emailRef.current?.focus();
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setLoading(true);

    // Mock — simulate network delay, always succeed
    await new Promise((r) => setTimeout(r, 1200));

    setLoading(false);
    setSent(true);
  }

  return (
    <div className={`${styles.page} ${mounted ? styles.pageMounted : ''}`}>
      {/* Decorative left accent */}
      <div className={styles.accent} aria-hidden="true">
        <div className={styles.accentInner}>
          <ShieldIcon className={styles.accentIcon} />
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.container}>
          {/* Back link */}
          <Link to="/login" className={`${styles.backLink} ${mounted ? styles.stagger1 : ''}`}>
            <ArrowLeftIcon className={styles.backIcon} />
            <span>Back to Sign In</span>
          </Link>

          {sent ? (
            /* ── Success State ─────────────────────────────── */
            <div className={`${styles.successBlock} ${styles.stagger1}`}>
              <div className={styles.successIconWrap}>
                <CheckCircleIcon className={styles.successIcon} />
              </div>
              <h2 className={styles.title}>Check Your Email</h2>
              <p className={styles.subtitle}>
                If an account exists for <strong>{email}</strong>, you will receive
                a password reset link shortly. The link will expire in 15 minutes.
              </p>
              <div className={styles.successInfo}>
                <p className={styles.infoText}>
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={() => { setSent(false); setEmail(''); }}
                >
                  Try another email
                </button>
              </div>
              <Link to="/login" className={styles.returnLink}>
                Return to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ────────────────────────────────── */
            <>
              <div className={`${styles.header} ${mounted ? styles.stagger2 : ''}`}>
                <h2 className={styles.title}>Forgot Password</h2>
                <p className={styles.subtitle}>
                  Enter the email address associated with your account and
                  we'll send you an encrypted link to reset your password.
                </p>
              </div>

              {error && (
                <div className={styles.error} role="alert">
                  <span className={styles.errorText}>{error}</span>
                </div>
              )}

              <form className={`${styles.form} ${mounted ? styles.stagger3 : ''}`} onSubmit={handleSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="forgot-email">
                    Email Address
                  </label>
                  <div className={styles.inputWrap}>
                    <MailIcon className={styles.inputIcon} />
                    <input
                      ref={emailRef}
                      id="forgot-email"
                      className={`${styles.input} ${error ? styles.inputError : ''}`}
                      type="email"
                      autoComplete="email"
                      placeholder="name@agency.gov"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} aria-hidden="true" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <SendIcon className={styles.btnIcon} />
                    </>
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
