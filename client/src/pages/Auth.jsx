import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AtSign, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User, XCircle, MapPin, MessageSquare, TerminalSquare, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { apiOrigin } from '../utils/runtimeConfig';

const HOME_WELCOME_EVENT_KEY = 'dc_home_welcome_event';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.7h5.4a4.62 4.62 0 0 1-2 3.04v2.52h3.23c1.89-1.74 2.97-4.3 2.97-7.3Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.23-2.52c-.9.6-2.06.96-3.38.96-2.6 0-4.8-1.75-5.58-4.1H3.09v2.6A9.99 9.99 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.42 13.9A6 6 0 0 1 6.1 12c0-.66.12-1.3.32-1.9V7.5H3.09a10 10 0 0 0 0 9l3.33-2.6Z" />
    <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.5 3.84 1.48l2.88-2.88C16.95 2.93 14.69 2 12 2a9.99 9.99 0 0 0-8.91 5.5l3.33 2.6c.78-2.35 2.98-4.12 5.58-4.12Z" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = apiOrigin;
  const isLoginMode = location.pathname === '/login';
  const mode = isLoginMode ? 'login' : 'register';
  const { login, register } = useContext(AuthContext);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotResetUrl, setForgotResetUrl] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const passwordsMatch = mode === 'login' ? true : (confirmPassword.length > 0 ? password === confirmPassword : true);
  const canSubmit = mode === 'login'
    ? emailValid && passwordValid && !loading
    : emailValid && passwordValid && passwordsMatch && usernameStatus === 'available' && agreedToTerms && !loading;

  const strengthScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthPercent = (strengthScore / 5) * 100;
  const strengthLabel = strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strengthScore <= 2 ? 'bg-red-400' : strengthScore <= 4 ? 'bg-yellow-400' : 'bg-green-500';

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'register' || !username) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timeoutId = setTimeout(async () => {
      try {
        const formatted = username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const res = await api.get(`/users/check-username/${formatted}`);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [mode, username]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauthError');
    const resetSuccess = params.get('reset');
    if (oauthError) {
      sessionStorage.removeItem(HOME_WELCOME_EVENT_KEY);
      setError('Google sign-in failed. Please try again.');
    } else if (resetSuccess === 'success') {
      setError('');
      setForgotMessage('Password updated successfully. Please login with your new password.');
    } else {
      setError('');
    }
  }, [location.search]);

  const switchMode = (nextMode) => {
    if (loading) return;
    setError('');
    if (nextMode === 'login') navigate('/login');
    else navigate('/register');
  };

  const handleGoogleSignIn = () => {
    sessionStorage.setItem(HOME_WELCOME_EVENT_KEY, mode);
    window.location.href = `${apiBase}/api/auth/google?mode=${mode}`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotResetUrl('');
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setForgotError('Please enter your email.');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setForgotMessage(res.data?.message || 'If this email exists, reset instructions were sent.');
      setForgotResetUrl(res.data?.resetUrl || '');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Unable to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) return;
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, username, email, password);
      }
      sessionStorage.setItem(HOME_WELCOME_EVENT_KEY, mode);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex text-gray-900 bg-white page-transition">
      <div
        className="auth-left-panel hidden lg:flex lg:w-1/2 flex-col items-start justify-center p-12 relative overflow-hidden"
        style={{ background: 'radial-gradient(1100px 500px at -10% -10%, #84c7ff33 0%, transparent 55%), linear-gradient(150deg, #0a66c2 0%, #004182 52%, #012f59 100%)' }}
      >
        <div className="absolute inset-0 auth-grid-overlay opacity-30"></div>
        <div className="absolute -top-20 -left-12 h-72 w-72 rounded-full bg-white/15 blur-2xl animate-auth-float"></div>
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-auth-float-delayed"></div>
        <div className="relative z-10 text-white max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold tracking-wide mb-4">
            {mode === 'login' ? 'WELCOME BACK' : 'START YOUR PROFILE'}
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-[1.15]">
            {mode === 'login' ? 'Connect with developers. Build your network.' : 'Turn your skills into real opportunities.'}
          </h1>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg border border-white/20 shrink-0">
                <MapPin className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-[15px] text-blue-50 font-medium leading-snug">Find devs near you</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg border border-white/20 shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-[15px] text-blue-50 font-medium leading-snug">Real-time chat with your tech stack</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg border border-white/20 shrink-0">
                <TerminalSquare className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-[15px] text-blue-50 font-medium leading-snug">Share code & collaborate</p>
            </div>
          </div>

          {/* Animated Product Preview */}
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0b1120]/80 backdrop-blur-xl border border-white/10 shadow-2xl p-4 overflow-hidden group">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-2 text-xs font-mono text-gray-400">devconnect.tsx</span>
            </div>

            {/* Animated Chat Bubbles / Code */}
            <div className="space-y-4">
              <div className="flex gap-3 items-end w-3/4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 shrink-0"></div>
                <div className="p-3 rounded-2xl bg-white/10 rounded-bl-none w-full relative overflow-hidden">
                  <div className="h-2 w-3/4 bg-white/20 rounded mb-2"></div>
                  <div className="h-2 w-1/2 bg-white/20 rounded"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                </div>
              </div>

              <div className="flex gap-3 items-end w-3/4 self-end ml-auto justify-end animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                <div className="p-3 rounded-2xl bg-[#0a66c2]/80 rounded-br-none w-full relative overflow-hidden text-right">
                  <div className="h-2 w-full bg-white/30 rounded mb-2 ml-auto"></div>
                  <div className="h-2 w-2/3 bg-white/30 rounded ml-auto"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite_1s]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center lg:justify-start px-8 sm:px-16 md:px-24 bg-background lg:bg-[#f5f9ff] relative lg:h-screen lg:overflow-y-auto lg:pt-8">
        <div className="w-full max-w-md mx-auto relative z-10 py-10">
          <div className="rounded-3xl bg-white/85 backdrop-blur-md border border-white/70 shadow-[0_18px_40px_-24px_rgba(0,44,94,0.45)] p-5 sm:p-6">
            <div className="auth-brand-block mb-6 text-center lg:text-left">
              <Logo size="xlarge" clickable={false} className="auth-logo mx-auto lg:mx-0" />
            </div>

            <div className="mb-6 rounded-full p-1 bg-gray-100 border border-gray-200 flex relative overflow-hidden">
              <div
                className="absolute top-1 left-1 bottom-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
                style={{
                  width: 'calc(50% - 0.25rem)',
                  transform: mode === 'login' ? 'translateX(0)' : 'translateX(100%)',
                }}
              />
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`relative z-10 flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'login' ? 'text-[#0073b1]' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`relative z-10 flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'register' ? 'text-[#0073b1]' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Register
              </button>
            </div>

            <div key={animKey} className="auth-switch-enter">
              <h2 className="text-2xl font-semibold text-gray-800">{mode === 'login' ? 'Sign in' : 'Join now'}</h2>
              <p className="text-gray-500 mt-1 mb-6">{mode === 'login' ? 'Access real opportunities from real devs.' : 'Create your profile. Start collaborating today.'}</p>

              {error && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-fade-in">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700">Authentication failed</p>
                    <p className="text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
              {forgotMessage && !showForgotModal && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-500" />
                  <p>{forgotMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                        <input type="text" className="auth-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none transition-all bg-white" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Username</label>
                      <div className="relative group">
                        <AtSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                        <input
                          type="text"
                          className={`auth-input w-full pl-10 pr-10 py-3 border ${usernameStatus === 'taken' ? 'border-red-300 focus:border-red-500' : usernameStatus === 'available' ? 'border-green-300 focus:border-green-500' : 'border-gray-300'} rounded-lg outline-none transition-all bg-white`}
                          placeholder="unique_username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                          required
                        />
                        <div className="absolute right-3 top-3.5">
                          {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-[#0073b1] animate-spin" />}
                          {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {usernameStatus === 'taken' && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                    <input type="email" className={`auth-input w-full pl-10 pr-4 py-3 border ${email.length === 0 ? 'border-gray-300 focus:border-[#0073b1]' : emailValid ? 'border-green-400 focus:border-green-500' : 'border-red-400 focus:border-red-500'} rounded-lg outline-none transition-all bg-white`} placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {email.length > 0 && (
                      <span className="absolute right-3 top-3.5">
                        {emailValid ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                      </span>
                    )}
                  </div>
                  {email.length > 0 && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${emailValid ? 'text-green-600' : 'text-red-500'}`}>
                      {emailValid ? 'Email looks good' : 'Enter a valid email address'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                    <input type={showPassword ? 'text' : 'password'} className={`auth-input w-full pl-10 pr-12 py-3 border ${password.length === 0 ? 'border-gray-300 focus:border-[#0073b1]' : passwordValid ? 'border-green-400 focus:border-green-500' : 'border-red-400 focus:border-red-500'} rounded-lg outline-none transition-all bg-white`} placeholder="........" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <span role="button" tabIndex={0} onClick={() => setShowPassword((prev) => !prev)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPassword((prev) => !prev)} onMouseDown={(e) => e.preventDefault()} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {password.length > 0 ? (
                      <p className={`text-xs flex items-center gap-1 ${passwordValid ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {passwordValid ? 'Password looks secure' : 'Use at least 8 characters'}
                      </p>
                    ) : <span />}
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email || '');
                          setForgotError('');
                          setForgotMessage('');
                          setForgotResetUrl('');
                          setShowForgotModal(true);
                        }}
                        className="text-xs text-[#0073b1] font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                </div>

                {mode === 'register' && (
                  <>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: `${strengthPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Strength: {strengthLabel}</p>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                        <input type={showConfirmPassword ? 'text' : 'password'} className={`auth-input w-full pl-10 pr-12 py-3 border ${confirmPassword.length === 0 ? 'border-gray-300 focus:border-[#0073b1]' : passwordsMatch ? 'border-green-400 focus:border-green-500' : 'border-red-400 focus:border-red-500'} rounded-lg outline-none transition-all bg-white`} placeholder="........" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        <span role="button" tabIndex={0} onClick={() => setShowConfirmPassword((prev) => !prev)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowConfirmPassword((prev) => !prev)} onMouseDown={(e) => e.preventDefault()} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer">
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p className={`text-xs flex items-center gap-1 mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                          {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="terms-agreement"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-[#0073b1] border-gray-300 rounded cursor-pointer focus:ring-[#0073b1]"
                      />
                      <label htmlFor="terms-agreement" className="text-sm text-gray-700 cursor-pointer">
                        I agree to the{' '}
                        <Link to="/terms" className="text-[#0073b1] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-[#0073b1] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </>
                )}

                <button type="submit" disabled={!canSubmit || loading} className={`auth-primary-btn w-full flex justify-center items-center gap-2 py-3.5 rounded-full text-white font-semibold text-lg shadow-lg transition-all duration-300 ${(!canSubmit || loading) ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'}`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Agree and Join'
                  )}
                </button>

                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 mt-2">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span className="px-1">or continue with</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="group w-full flex justify-center items-center gap-3 py-3.5 rounded-full border-2 border-[#0073b1]/30 bg-white text-[#0073b1] font-semibold text-base shadow-sm hover:border-[#0073b1] hover:bg-[#0073b1]/5 hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                {mode === 'login' ? (
                  <>New to DevConnect? <Link to="/register" className="text-[#0073b1] font-bold hover:underline">Join now</Link></>
                ) : (
                  <>Already on DevConnect? <Link to="/login" className="text-[#0073b1] font-bold hover:underline">Sign in</Link></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForgotModal(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">Forgot password</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Enter your email and we’ll send a reset link.</p>
            {forgotError && <div className="mb-3 p-2 rounded-lg bg-red-100 text-red-700 text-sm">{forgotError}</div>}
            {forgotMessage && <div className="mb-3 p-2 rounded-lg bg-green-100 text-green-700 text-sm">{forgotMessage}</div>}
            {forgotResetUrl && (
              <a href={forgotResetUrl} className="mb-3 block text-sm font-semibold text-[#0073b1] hover:underline break-all">
                Open reset link
              </a>
            )}
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="auth-input w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none"
                placeholder="name@example.com"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={forgotLoading} className={`px-4 py-2 text-sm rounded-lg bg-[#0073b1] text-white font-semibold ${forgotLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#005f92]'}`}>
                  {forgotLoading ? 'Sending...' : 'Send link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
