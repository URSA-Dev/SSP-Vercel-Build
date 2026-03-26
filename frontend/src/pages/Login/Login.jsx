/**
 * @file Login.jsx
 * @description Login page for URSA SSP (Security Support Platform).
 *
 * Split-screen layout:
 *   - LEFT:  Animated brand panel with particle constellation, radar rings,
 *            data streams, scan line, and URSA logo / compliance badges.
 *   - RIGHT: Authentication form with email/password, remember-me, and
 *            staggered entrance animations.
 *
 * @module pages/Login
 * @requires react
 * @requires react-router-dom
 * @requires ../../services/auth.service
 * @requires ./Login.module.css
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/auth.service';
import styles from './Login.module.css';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: Inline SVG Icon Components
// Description: Lightweight SVG icons rendered inline to avoid external
//              icon-library dependencies. Each accepts a `className` prop
//              for style injection via CSS Modules.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MailIcon — Envelope icon for the email input field.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

/**
 * LockIcon — Padlock icon for the password input field.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

/**
 * EyeIcon — Open eye icon indicating password is visible.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function EyeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * EyeOffIcon — Closed/slashed eye icon indicating password is hidden.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
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

/**
 * AlertCircleIcon — Circled exclamation mark for error alerts.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function AlertCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * ShieldCheckIcon — Shield with checkmark for compliance badge items.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/**
 * ArrowRightIcon — Right-pointing arrow for the submit button CTA.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function ArrowRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: Brand Logo SVG
// Description: Geometric wireframe bear that mirrors the URSA brand identity.
//              Used as a decorative accent — the main logo is a PNG <img>.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UrsaBearLogo — Geometric polygon wireframe bear matching the URSA brand.
 * Decorative only (aria-hidden). Contains "URSA" text.
 * @param {{ className: string }} props
 * @returns {JSX.Element}
 */
function UrsaBearLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 320 120" fill="none" aria-hidden="true">
      {/* Geometric bear — polygon wireframe */}
      <g stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinejoin="round" fill="none">
        {/* Body */}
        <polygon points="20,85 30,55 50,45 65,50 75,65 70,85" fill="rgba(255,255,255,0.04)" />
        <polygon points="50,45 65,50 80,40 70,30 55,32" fill="rgba(255,255,255,0.03)" />
        <polygon points="70,30 80,40 95,38 90,25 78,22" fill="rgba(255,255,255,0.02)" />
        {/* Head */}
        <polygon points="80,40 95,38 100,50 90,55 75,65 65,50" fill="rgba(255,255,255,0.04)" />
        <polygon points="95,38 105,32 110,42 100,50" fill="rgba(255,255,255,0.03)" />
        {/* Legs */}
        <polygon points="30,55 20,85 40,90 50,70" fill="rgba(255,255,255,0.03)" />
        <polygon points="50,70 40,90 55,95 60,80 75,65" fill="rgba(255,255,255,0.02)" />
        <polygon points="75,65 60,80 70,95 85,90 90,55 100,50" fill="rgba(255,255,255,0.03)" />
        {/* Back */}
        <polygon points="20,85 40,90 55,95 70,95 85,90 75,85 50,88 30,86" fill="rgba(255,255,255,0.02)" />
        {/* Ear triangles */}
        <polygon points="70,30 78,22 65,18 60,25 55,32" fill="rgba(255,255,255,0.03)" />
        <polygon points="78,22 90,25 88,15 80,13" fill="rgba(255,255,255,0.03)" />
        {/* Inner detail lines */}
        <line x1="50" y1="45" x2="75" y2="65" />
        <line x1="65" y1="50" x2="90" y2="55" />
        <line x1="80" y1="40" x2="65" y2="50" />
        <line x1="30" y1="55" x2="50" y2="70" />
      </g>
      {/* URSA text */}
      <text x="130" y="58" fontFamily="'Outfit', system-ui, sans-serif" fontSize="42" fontWeight="800" fill="white" letterSpacing="3">
        URSA
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: Animated Background Components
// Description: Visual effects layered on the brand panel — particle
//              constellation, radar sonar rings, scan line, and data streams.
//              All animations respect `prefers-reduced-motion` via CSS.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ParticleNetwork — Animated constellation background for the brand panel.
 *
 * Renders 30 static particles at pre-defined positions and draws connection
 * lines between any two particles within 200px of each other. Opacity of
 * each connection fades with distance.
 *
 * Animations (pulse, flicker) are driven entirely by CSS keyframes inside
 * Login.module.css and are disabled when `prefers-reduced-motion: reduce`.
 *
 * @returns {JSX.Element} Full-viewport SVG overlay (pointer-events: none)
 */
function ParticleNetwork() {
  /** @type {Array<{cx: number, cy: number, r: number, delay: number}>} */
  const particles = [
    { cx: 80, cy: 60, r: 1.8, delay: 0 },
    { cx: 200, cy: 100, r: 2.2, delay: 1.2 },
    { cx: 340, cy: 50, r: 1.5, delay: 0.6 },
    { cx: 480, cy: 90, r: 2, delay: 2 },
    { cx: 140, cy: 200, r: 1.6, delay: 0.8 },
    { cx: 300, cy: 180, r: 2.5, delay: 1.5 },
    { cx: 440, cy: 220, r: 1.8, delay: 0.3 },
    { cx: 560, cy: 150, r: 1.4, delay: 2.5 },
    { cx: 60, cy: 320, r: 2, delay: 1 },
    { cx: 180, cy: 350, r: 1.7, delay: 1.8 },
    { cx: 320, cy: 300, r: 2.3, delay: 0.4 },
    { cx: 460, cy: 340, r: 1.5, delay: 2.2 },
    { cx: 540, cy: 280, r: 1.9, delay: 0.7 },
    { cx: 100, cy: 460, r: 2.1, delay: 1.3 },
    { cx: 250, cy: 440, r: 1.6, delay: 0.9 },
    { cx: 400, cy: 480, r: 2, delay: 2.1 },
    { cx: 520, cy: 420, r: 1.8, delay: 0.2 },
    { cx: 50, cy: 580, r: 1.5, delay: 1.6 },
    { cx: 180, cy: 560, r: 2.2, delay: 0.5 },
    { cx: 350, cy: 600, r: 1.7, delay: 2.4 },
    { cx: 490, cy: 550, r: 2, delay: 1.1 },
    { cx: 580, cy: 500, r: 1.4, delay: 1.9 },
    { cx: 120, cy: 700, r: 1.9, delay: 0.1 },
    { cx: 280, cy: 720, r: 2.1, delay: 1.7 },
    { cx: 430, cy: 680, r: 1.6, delay: 2.3 },
    { cx: 560, cy: 650, r: 2, delay: 0.8 },
    { cx: 70, cy: 140, r: 1.3, delay: 1.4 },
    { cx: 520, cy: 60, r: 1.7, delay: 0.6 },
    { cx: 380, cy: 380, r: 1.5, delay: 2.6 },
    { cx: 160, cy: 520, r: 1.8, delay: 1.0 },
  ];

  /** @type {Array<{x1: number, y1: number, x2: number, y2: number, opacity: number, delay: number}>} */
  const connections = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].cx - particles[j].cx;
      const dy = particles[i].cy - particles[j].cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const opacity = Math.max(0.03, 0.08 - (dist / 200) * 0.06);
        connections.push({
          x1: particles[i].cx, y1: particles[i].cy,
          x2: particles[j].cx, y2: particles[j].cy,
          opacity,
          delay: (particles[i].delay + particles[j].delay) / 2
        });
      }
    }
  }

  return (
    <svg
      className={styles.particleNetwork}
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(42,90,140,0.6)" />
          <stop offset="100%" stopColor="rgba(42,90,140,0)" />
        </radialGradient>
      </defs>

      {/* Connection lines */}
      <g className={styles.connectionLines}>
        {connections.map((c, i) => (
          <line
            key={`conn-${i}`}
            x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            stroke="rgba(42,90,140,0.12)"
            strokeWidth="0.6"
            className={styles.connLine}
            style={{ animationDelay: `${c.delay}s` }}
          />
        ))}
      </g>

      {/* Particles */}
      <g className={styles.particleGroup}>
        {particles.map((p, i) => (
          <g key={`particle-${i}`}>
            {/* Glow */}
            <circle
              cx={p.cx} cy={p.cy} r={p.r * 4}
              fill="url(#particleGlow)"
              className={styles.particleGlow}
              style={{ animationDelay: `${p.delay}s` }}
            />
            {/* Core */}
            <circle
              cx={p.cx} cy={p.cy} r={p.r}
              fill="rgba(255,255,255,0.5)"
              className={styles.particleCore}
              style={{ animationDelay: `${p.delay}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * FormParticleNetwork — Static grayscale constellation for the form panel.
 *
 * Same dot-and-line concept as ParticleNetwork but rendered in faint gray
 * on a white background with NO animation. Particles are spread toward edges
 * so the center (where the form sits) stays clear.
 *
 * @returns {JSX.Element} Static SVG overlay (pointer-events: none)
 */
function FormParticleNetwork() {
  const particles = [
    { cx: 40, cy: 30, r: 1.8 },
    { cx: 160, cy: 60, r: 2.0 },
    { cx: 350, cy: 25, r: 1.5 },
    { cx: 560, cy: 50, r: 1.7 },
    { cx: 660, cy: 100, r: 2.0 },
    { cx: 30, cy: 200, r: 1.6 },
    { cx: 650, cy: 250, r: 1.9 },
    { cx: 50, cy: 400, r: 2.2 },
    { cx: 670, cy: 420, r: 1.4 },
    { cx: 20, cy: 580, r: 1.8 },
    { cx: 140, cy: 650, r: 1.5 },
    { cx: 580, cy: 620, r: 2.0 },
    { cx: 680, cy: 560, r: 1.7 },
    { cx: 60, cy: 780, r: 1.9 },
    { cx: 250, cy: 850, r: 1.6 },
    { cx: 480, cy: 870, r: 2.1 },
    { cx: 650, cy: 800, r: 1.8 },
    { cx: 400, cy: 50, r: 1.4 },
  ];

  const connections = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].cx - particles[j].cx;
      const dy = particles[i].cy - particles[j].cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220) {
        const opacity = Math.max(0.02, 0.06 - (dist / 220) * 0.04);
        connections.push({
          x1: particles[i].cx, y1: particles[i].cy,
          x2: particles[j].cx, y2: particles[j].cy,
          opacity,
        });
      }
    }
  }

  return (
    <svg
      className={styles.formParticleNetwork}
      viewBox="0 0 700 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="formParticleGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Connection lines */}
      <g>
        {connections.map((c, i) => (
          <line
            key={`fconn-${i}`}
            x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="0.6"
          />
        ))}
      </g>

      {/* Particles */}
      <g>
        {particles.map((p, i) => (
          <g key={`fpart-${i}`}>
            <circle
              cx={p.cx} cy={p.cy} r={p.r * 4}
              fill="url(#formParticleGlow)"
            />
            <circle
              cx={p.cx} cy={p.cy} r={p.r}
              fill="rgba(0,0,0,0.20)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * RadarRings — Pulsing concentric sonar rings behind the brand logo area.
 *
 * Four expanding rings animated via CSS `radarPulse` keyframes with
 * staggered delays (0s, 1.5s, 3s, 4.5s). Purely decorative (aria-hidden).
 *
 * @returns {JSX.Element}
 */
function RadarRings() {
  return (
    <div className={styles.radarContainer} aria-hidden="true">
      <div className={`${styles.radarRing} ${styles.radarRing1}`} />
      <div className={`${styles.radarRing} ${styles.radarRing2}`} />
      <div className={`${styles.radarRing} ${styles.radarRing3}`} />
      <div className={`${styles.radarRing} ${styles.radarRing4}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION: Login Page Component (default export)
// Description: Main page component — split-screen layout with animated
//              brand panel (left) and authentication form (right).
//              Handles form state, validation, API auth, error display,
//              session persistence, and staggered mount animations.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Login — Primary authentication page for URSA SSP.
 *
 * Layout:
 *   Desktop — 45/55 split: brand panel (left) + form panel (right)
 *   Mobile  — Stacked: brand panel hidden, mobile logo shown above form
 *
 * State:
 *   @state {string}  email        — User email input value
 *   @state {string}  password     — User password input value
 *   @state {boolean} showPassword — Toggle password field visibility
 *   @state {boolean} remember     — "Remember me" checkbox state
 *   @state {boolean} loading      — True while auth API call is in-flight
 *   @state {string}  error        — Error message displayed in alert banner
 *   @state {boolean} mounted      — Triggers CSS entrance animations after 50ms
 *
 * Behavior:
 *   - Auto-focuses email field on mount
 *   - Redirects to "/" if a valid token already exists in localStorage
 *   - Calls auth.service.login() on submit; stores token on success
 *   - Displays contextual error messages for 401, 403, 429, offline, etc.
 *
 * @returns {JSX.Element}
 */
export default function Login() {
  const navigate = useNavigate();

  /** @type {React.RefObject<HTMLInputElement>} Ref for auto-focusing the email field */
  const emailRef = useRef(null);

  // ── Form State ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // ── UI State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // ── Effects ─────────────────────────────────────────────────────────────

  /** Trigger CSS mount animations after a 50ms paint delay */
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  /** Auto-focus the email input on initial render */
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  /** Redirect authenticated users away from the login page */
  useEffect(() => {
    const token = localStorage.getItem('ssp_token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ── Form Handler ────────────────────────────────────────────────────────

  /**
   * handleSubmit — Validates inputs, calls the auth API, and handles
   * success/error outcomes.
   *
   * Error handling covers:
   *   - 401/403: Invalid credentials
   *   - 429:     Rate-limited (too many attempts)
   *   - Offline: No network connection
   *   - Other:   Generic server error
   *
   * @param {React.FormEvent<HTMLFormElement>} e — Form submission event
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // ── Client-side validation ──
    if (!email.trim()) {
      setError('Please enter your email address.');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      // ── API call to backend auth endpoint ──
      const result = await login(email.trim(), password);
      if (result?.token) {
        if (remember) {
          localStorage.setItem('ssp_remember', 'true');
        }
        navigate('/', { replace: true });
      } else {
        setError('Authentication failed. Please check your credentials and try again.');
      }
    } catch (err) {
      // ── Map HTTP status codes to user-friendly messages ──
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Invalid email or password. Please try again.');
      } else if (status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (!navigator.onLine) {
        setError('No network connection. Please check your internet and try again.');
      } else {
        setError('Unable to connect to the server. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.page} ${mounted ? styles.pageMounted : ''}`}>
      {/* ══════════════════════════════════════════════
          LEFT PANEL — Animated Security Brand Panel
          Visible on desktop (>=769px), hidden on mobile.
          Contains: particle network, scan line, data
          streams, radar rings, URSA logo, title,
          tagline, and compliance badges.
      ══════════════════════════════════════════════ */}
      <div className={styles.brandPanel}>
        {/* Animated particle constellation */}
        <ParticleNetwork />

        {/* Scanning line effect */}
        <div className={styles.scanLine} aria-hidden="true" />

        {/* Data stream columns */}
        <div className={styles.dataStreams} aria-hidden="true">
          <div className={`${styles.dataStream} ${styles.ds1}`} />
          <div className={`${styles.dataStream} ${styles.ds2}`} />
          <div className={`${styles.dataStream} ${styles.ds3}`} />
          <div className={`${styles.dataStream} ${styles.ds4}`} />
          <div className={`${styles.dataStream} ${styles.ds5}`} />
          <div className={`${styles.dataStream} ${styles.ds6}`} />
        </div>

        {/* Radar rings behind logo */}
        <RadarRings />

        {/* Brand content */}
        <div className={styles.brandContent}>
          <div className={styles.brandTop}>
            <img
              src="/URSA_Logo_Landing_600w.png"
              alt="URSA"
              className={`${styles.brandLogo} ${mounted ? styles.logoMounted : ''}`}
            />
            <div className={`${styles.brandDivider} ${mounted ? styles.dividerMounted : ''}`} />
            <h1 className={`${styles.brandTitle} ${mounted ? styles.titleMounted : ''}`}>
              Security Support Platform
            </h1>
            <p className={`${styles.brandTagline} ${mounted ? styles.taglineMounted : ''}`}>
              Enterprise-grade personnel security case management
            </p>
          </div>

          <div className={styles.brandBottom}>
            <div className={styles.brandFeatures}>
              <div className={`${styles.featureItem} ${mounted ? styles.featureMounted1 : ''}`}>
                <ShieldCheckIcon className={styles.featureIcon} />
                <span>FedRAMP Authorized</span>
              </div>
              <div className={`${styles.featureItem} ${mounted ? styles.featureMounted2 : ''}`}>
                <ShieldCheckIcon className={styles.featureIcon} />
                <span>NIST 800-53 Compliant</span>
              </div>
              <div className={`${styles.featureItem} ${mounted ? styles.featureMounted3 : ''}`}>
                <ShieldCheckIcon className={styles.featureIcon} />
                <span>IL5 Cloud Hosted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Authentication Form
          Contains: mobile logo (shown <769px), form
          header, error alert, email field, password
          field with visibility toggle, remember-me +
          forgot-password row, submit button with
          loading spinner, create-account link, footer.
      ══════════════════════════════════════════════ */}
      <div className={styles.formPanel}>
        <FormParticleNetwork />
        <div className={styles.formContainer}>
          {/* Mobile logo — only visible on small screens */}
          <div className={styles.mobileLogo}>
            <img
              src="/URSA_Logo_Landing_600w.png"
              alt="URSA"
              className={styles.mobileLogoImg}
            />
          </div>

          {/* Form header */}
          <div className={`${styles.formHeader} ${mounted ? styles.stagger1 : ''}`}>
            <h2 className={styles.formTitle}>Sign In</h2>
            <p className={styles.formSubtitle}>
              Enter your credentials to access the platform
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.error} role="alert" id="login-error">
              <AlertCircleIcon className={styles.errorIcon} />
              <span className={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={`${styles.field} ${mounted ? styles.stagger2 : ''}`}>
              <label className={styles.label} htmlFor="login-email">
                Email Address
              </label>
              <div className={styles.inputWrap}>
                <MailIcon className={styles.inputIcon} />
                <input
                  ref={emailRef}
                  id="login-email"
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                  type="email"
                  autoComplete="email"
                  placeholder="name@agency.gov"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={loading}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`${styles.field} ${mounted ? styles.stagger3 : ''}`}>
              <label className={styles.label} htmlFor="login-password">
                Password
              </label>
              <div className={styles.inputWrap}>
                <LockIcon className={styles.inputIcon} />
                <input
                  id="login-password"
                  className={`${styles.input} ${styles.inputPassword} ${error ? styles.inputError : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me + Forgot Password */}
            <div className={`${styles.options} ${mounted ? styles.stagger4 : ''}`}>
              <label className={styles.checkGroup}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span className={styles.checkLabel}>Remember me</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`${styles.submitBtn} ${mounted ? styles.stagger5 : ''} ${loading ? styles.submitLoading : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner} aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className={styles.btnArrow} />
                </>
              )}
            </button>
          </form>

          {/* Create Account */}
          <div className={`${styles.createRow} ${mounted ? styles.stagger6 : ''}`}>
            <span className={styles.createText}>Don't have an account?</span>
            <Link to="/register" className={styles.createLink}>
              Create Account
            </Link>
          </div>

          {/* Footer */}
          <div className={`${styles.footer} ${mounted ? styles.stagger7 : ''}`}>
            <span className={styles.footerText}>
              URSA &copy; {new Date().getFullYear()} &middot; All rights reserved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
