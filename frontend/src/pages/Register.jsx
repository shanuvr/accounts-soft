import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../store/authStore';

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = (invalid) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${
    invalid
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
  }`;

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactNo: '',
    companyEmail: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.username.trim()) newErrors.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username)) newErrors.username = 'Only letters, numbers, dots, dashes and underscores';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.contactNo.trim()) newErrors.contactNo = 'Contact number is required';
    if (form.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail))
      newErrors.companyEmail = 'Enter a valid email address';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError('');
      const result = await register(
        {
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
        },
        {
          name: form.companyName,
          contact_no: form.contactNo,
          email: form.companyEmail,
          address: form.address,
        }
      );
      if (result.success) {
        navigate('/dashboard');
      } else {
        setSubmitError(result.error || 'Registration failed');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ============================ TOP BAR ============================ */}
      <div className="flex items-center justify-center gap-3 border-b border-slate-200 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
            <path d="M4 4h11a4 4 0 0 1 4 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 14l2.5-2.5 2 2L15.5 9.5 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-slate-900">Account Soft</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Order · Delivery · Finance</p>
        </div>
      </div>

      {/* ============================ FORM ============================ */}
      <div className="mx-auto w-full max-w-lg px-6 py-10">
        <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-1.5 text-sm text-slate-500">Set up your company workspace. You&apos;ll be its administrator.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8" noValidate>
          {/* Admin account */}
          <section className="space-y-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-400">Your account</h3>
            <Field label="Full name" error={errors.name}>
              <input type="text" autoComplete="name" placeholder="John Doe" value={form.name} onChange={set('name')} className={inputClass(errors.name)} />
            </Field>
            <Field label="Username" error={errors.username}>
              <input type="text" autoComplete="username" placeholder="john.doe" value={form.username} onChange={set('username')} className={inputClass(errors.username)} />
            </Field>
            <Field label="Email address" error={errors.email}>
              <input type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} className={inputClass(errors.email)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Password" error={errors.password}>
                <input type="password" autoComplete="new-password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} className={inputClass(errors.password)} />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input type="password" autoComplete="new-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} className={inputClass(errors.confirmPassword)} />
              </Field>
            </div>
          </section>

          {/* Company details */}
          <section className="space-y-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-400">Company details</h3>
            <Field label="Company name" error={errors.companyName}>
              <input type="text" placeholder="Acme Pvt Ltd" value={form.companyName} onChange={set('companyName')} className={inputClass(errors.companyName)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Contact number" error={errors.contactNo}>
                <input type="tel" placeholder="98765 43210" value={form.contactNo} onChange={set('contactNo')} className={inputClass(errors.contactNo)} />
              </Field>
              <Field label="Company email" error={errors.companyEmail}>
                <input type="email" placeholder="contact@company.com" value={form.companyEmail} onChange={set('companyEmail')} className={inputClass(errors.companyEmail)} />
              </Field>
            </div>
            <Field label="Address" error={errors.address}>
              <textarea rows={3} placeholder="Street, City, State - PIN" value={form.address} onChange={set('address')} className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${inputClass(errors.address)}`} />
            </Field>
          </section>

          {submitError && <p className="text-center text-xs text-red-500">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin text-white">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Creating your workspace...
              </>
            ) : (
              'Create account'
            )}
          </button>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Already have an account?{' '}
            <Link to="/" className="font-medium text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;