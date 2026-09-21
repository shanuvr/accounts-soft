import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail } from '../data/mockData';
import { setUser } from '../store/authStore';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setUser(getUserByEmail(email));
      setTimeout(() => navigate('/dashboard'), 700);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* ============================ LEFT - GREEN PANEL ============================ */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 lg:block">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10" style={{ filter: 'blur(90px)' }} />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-emerald-900/30" style={{ filter: 'blur(110px)' }} />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-emerald-950/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-5.5 w-5.5 text-emerald-600">
                <path d="M4 4h11a4 4 0 0 1 4 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 14l2.5-2.5 2 2L15.5 9.5 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-[17px] font-semibold tracking-tight text-white">Account Soft</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-100/90">Order · Delivery · Finance</p>
            </div>
          </div>

          {/* Headline */}
          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white">
              Every order, from confirmation to payment settled.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-emerald-50/85">
              Orders, technical data, assignments, deliveries and payments — tracked end to end in one connected system.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <div>
                <p className="text-2xl font-semibold text-white">1,200+</p>
                <p className="mt-0.5 text-[12px] text-emerald-100/75">Orders managed</p>
              </div>
              <div className="h-10 w-px bg-white/25" />
              <div>
                <p className="text-2xl font-semibold text-white">100%</p>
                <p className="mt-0.5 text-[12px] text-emerald-100/75">Single source of truth</p>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="flex items-center gap-2 text-[12px] tracking-wide text-emerald-100/75">
            <span>Orders</span><span className="text-white/30">/</span>
            <span>PTD</span><span className="text-white/30">/</span>
            <span>Assignments</span><span className="text-white/30">/</span>
            <span>Deliveries</span><span className="text-white/30">/</span>
            <span>Payments</span>
          </div>
        </div>
      </div>

      {/* ============================ RIGHT - FORM ============================ */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-5.5 w-5.5 text-white">
                <path d="M4 4h11a4 4 0 0 1 4 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 14l2.5-2.5 2 2L15.5 9.5 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="text-left">
              <p className="text-[17px] font-semibold tracking-tight text-slate-900">Account Soft</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-600">Order · Delivery · Finance</p>
            </div>
          </div>

          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M3 5h18v14H3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="m3.5 6.5 8.5 7 8.5-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-medium text-slate-700">
                  Password
                </label>
                <a href="#forgot" className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-10 w-full rounded-lg border bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
                      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M10.6 5.2A9.6 9.6 0 0 1 12 5.1c6.5 0 10 6.9 10 6.9a19.1 19.1 0 0 1-3.1 4M6.6 6.6A17.5 17.5 0 0 0 2 12s3.5 6.9 10 6.9c1.5 0 2.9-.3 4.1-.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.6 9.7a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer select-none items-center gap-2.5">
              <span className="relative">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
                <span className="block h-4 w-4 rounded border border-slate-300 bg-white transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-100" />
                <svg viewBox="0 0 16 16" fill="none" className="absolute left-0 top-0 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                  <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[13px] text-slate-600">Remember me</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin text-white">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Demo: <span className="font-mono text-slate-600">admin@accountsoft.com</span> / <span className="font-mono text-slate-600">admin123</span>
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Account Soft · Integrated with Lead Soft</p>
        </div>
      </div>
    </div>
  );
}

export default Login;