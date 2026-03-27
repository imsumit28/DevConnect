import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.7h5.4a4.62 4.62 0 0 1-2 3.04v2.52h3.23c1.89-1.74 2.97-4.3 2.97-7.3Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.23-2.52c-.9.6-2.06.96-3.38.96-2.6 0-4.8-1.75-5.58-4.1H3.09v2.6A9.99 9.99 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.42 13.9A6 6 0 0 1 6.1 12c0-.66.12-1.3.32-1.9V7.5H3.09a10 10 0 0 0 0 9l3.33-2.6Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.98c1.47 0 2.8.5 3.84 1.48l2.88-2.88C16.95 2.93 14.69 2 12 2a9.99 9.99 0 0 0-8.91 5.5l3.33 2.6c.78-2.35 2.98-4.12 5.58-4.12Z"
    />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !loading;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauthError');
    if (oauthError) {
      setError('Google sign-in failed. Please try again.');
    }
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBase}/api/auth/google?mode=login`;
  };

  return (
    <div className="min-h-screen flex text-gray-900 bg-white page-transition">
      <div
        className="auth-left-panel hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: 'radial-gradient(1200px 500px at -10% -20%, #59a8ff33 0%, transparent 55%), linear-gradient(145deg, #0a66c2 0%, #004182 52%, #023062 100%)' }}
      >
        <div className="absolute inset-0 auth-grid-overlay opacity-35"></div>
        <div className="absolute -top-20 -left-12 h-72 w-72 rounded-full bg-white/15 blur-2xl animate-auth-float"></div>
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-auth-float-delayed"></div>
        <div className="relative z-10 text-white max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold tracking-wide mb-5">
            DEVCONNECT NETWORK
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold mb-5 leading-tight">Build your developer reputation in one place.</h1>
          <p className="text-lg text-blue-100 mb-8 max-w-lg">From conversations to opportunities, your work and network stay connected in real time.</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-2xl font-bold">50k+</p>
              <p className="text-xs text-blue-100">Active developers</p>
            </div>
            <div className="rounded-xl p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-2xl font-bold">1.2M+</p>
              <p className="text-xs text-blue-100">Monthly interactions</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl animate-auth-card">
            <p className="text-sm leading-relaxed">"DevConnect became my daily workspace for learning, sharing, and getting discovered."</p>
            <p className="mt-3 text-xs font-semibold opacity-90">Sarah • Senior Engineer</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 bg-background lg:bg-white relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-100 blur-3xl opacity-50 lg:hidden"></div>

        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="auth-brand-block mb-8 text-center lg:text-left">
            <Logo size="xlarge" clickable={false} className="auth-logo mx-auto lg:mx-0" />
            <h2 className="text-2xl font-semibold text-gray-800">Sign in</h2>
            <p className="text-gray-500">Stay updated on your professional world</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email format</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                <input
                  type="email"
                  className="auth-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none transition-all bg-white"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className={`text-xs flex items-center gap-1 ${email.length === 0 ? 'text-gray-400' : emailValid ? 'text-green-600' : 'text-red-500'}`}>
                {email.length > 0 && (emailValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />)}
                {email.length === 0 ? 'Enter a valid email address' : emailValid ? 'Email looks good' : 'Please enter a valid email'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg outline-none transition-all bg-white"
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPassword((prev) => !prev)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </span>
              </div>
              <p className={`text-xs ${password.length === 0 ? 'text-gray-400' : passwordValid ? 'text-green-600' : 'text-red-500'}`}>
                {password.length === 0 ? 'Use at least 8 characters' : passwordValid ? 'Password length is valid' : 'Password must be at least 8 characters'}
              </p>
              <div className="flex justify-end pt-1">
                <button type="button" className="text-sm text-[#0073b1] font-semibold hover:underline">Forgot password?</button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-3 py-3 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold transition-all duration-200 hover:border-[#0073b1] hover:text-[#0073b1]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span>or</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`auth-primary-btn w-full flex justify-center items-center gap-2 py-3.5 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            New to DevConnect?{' '}
            <Link to="/register" className="text-[#0073b1] font-bold hover:underline transition-all duration-200 hover:tracking-wide">Join now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
