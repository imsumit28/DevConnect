import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { Mail, Lock, User, ArrowRight, CheckCircle2, XCircle, Loader2, AtSign, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { apiOrigin } from '../utils/runtimeConfig';

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

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useContext(AuthContext);
  const apiBase = apiOrigin;
  const formPaneRef = useRef(null);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 ? password === confirmPassword : true;
  const getPasswordStrength = (value) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };
  const strengthScore = getPasswordStrength(password);
  const strengthPercent = (strengthScore / 5) * 100;
  const strengthLabel = strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strengthScore <= 2 ? 'bg-red-400' : strengthScore <= 4 ? 'bg-yellow-400' : 'bg-green-500';
  const canSubmit = !loading && emailValid && passwordValid && passwordsMatch && usernameStatus === 'available';

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    const timeoutId = setTimeout(async () => {
      try {
        const formatted = username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const res = await api.get(`/users/check-username/${formatted}`);
        if (res.data.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauthError');
    if (oauthError) {
      setError('Google sign-in failed. Please try again.');
    }
  }, [location.search]);

  useEffect(() => {
    if (formPaneRef.current) {
      formPaneRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setUsername(val);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (usernameStatus !== 'available') {
      return setError('Please choose an available username');
    }

    setLoading(true);
    try {
      await register(name, username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBase}/api/auth/google?mode=register`;
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex text-gray-900 bg-white page-transition">
      <div
        className="auth-left-panel hidden lg:flex lg:w-1/2 flex-col items-start p-12 pt-8 relative overflow-hidden"
        style={{ background: 'radial-gradient(1000px 460px at 110% -10%, #8fd3ff2e 0%, transparent 58%), linear-gradient(160deg, #0b5fb2 0%, #004182 48%, #012f59 100%)' }}
      >
        <div className="absolute inset-0 auth-grid-overlay opacity-30"></div>
        <div className="absolute -top-20 -left-12 h-72 w-72 rounded-full bg-white/15 blur-2xl animate-auth-float"></div>
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-auth-float-delayed"></div>
        <div className="relative z-10 text-white max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold tracking-wide mb-5">
            START YOUR PROFILE
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold mb-5 leading-tight">Turn your skills into opportunities.</h1>
          <p className="text-lg text-blue-100 mb-8 max-w-lg">Create your profile once, then keep building your network with posts, chats, and career visibility.</p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-xl font-bold">10k+</p>
              <p className="text-xs text-blue-100">Active jobs</p>
            </div>
            <div className="rounded-xl p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-xl font-bold">50k+</p>
              <p className="text-xs text-blue-100">Developers</p>
            </div>
            <div className="rounded-xl p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-xl font-bold">2.4k</p>
              <p className="text-xs text-blue-100">Hiring teams</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl animate-auth-card">
            <p className="text-sm leading-relaxed">"Within a month, I got feedback on my projects and interview calls from recruiters."</p>
            <p className="mt-3 text-xs font-semibold opacity-90">Aman • Frontend Developer</p>
          </div>
        </div>
      </div>

      <div ref={formPaneRef} className="w-full lg:w-1/2 flex flex-col justify-center lg:justify-start px-8 sm:px-16 md:px-24 bg-background lg:bg-white relative lg:h-screen lg:overflow-y-auto lg:pt-8">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-100 blur-3xl opacity-50 lg:hidden"></div>

        <div className="w-full max-w-md mx-auto relative z-10 py-10">
          <div className="auth-brand-block mb-8 text-center lg:text-left">
            <Logo size="xlarge" clickable={false} className="auth-logo mx-auto lg:mx-0" />
            <h2 className="text-2xl font-semibold text-gray-800">Join now</h2>
            <p className="text-gray-500">Create your professional identity</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                <input
                  type="text"
                  className="auth-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none transition-all bg-white"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
                  onChange={handleUsernameChange}
                  required
                />
                <div className="absolute right-3 top-3.5">
                  {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-[#0073b1] animate-spin" />}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {usernameStatus === 'taken' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                <p className="text-xs text-gray-500">Lowercase letters, numbers, and underscores</p>
                {usernameStatus === 'checking' && <span className="text-xs text-[#0073b1] font-medium tracking-wide">Checking...</span>}
                {usernameStatus === 'available' && <span className="text-xs text-green-600 font-medium tracking-wide">Available</span>}
                {usernameStatus === 'taken' && <span className="text-xs text-red-600 font-medium tracking-wide">Already taken</span>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
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
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: `${strengthPercent}%` }}></div>
              </div>
              <p className="text-xs text-gray-500">Strength: {strengthLabel}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0073b1] transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg outline-none transition-all bg-white"
                  placeholder="........"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowConfirmPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </span>
              </div>
              <p className={`text-xs ${confirmPassword.length === 0 || passwordsMatch ? 'text-gray-500' : 'text-red-500'}`}>
                {confirmPassword.length === 0 ? 'Re-enter password to confirm' : passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
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

            <p className="text-xs text-gray-500 text-center mx-4">
              By clicking Agree and Join, you agree to the DevConnect User Agreement, Privacy Policy, and Cookie Policy.
            </p>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`auth-primary-btn w-full flex justify-center items-center gap-2 py-3.5 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Agree and Join
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-200 pt-6">
            Already on DevConnect?{' '}
            <Link to="/login" className="text-[#0073b1] font-bold hover:underline transition-all duration-200 hover:tracking-wide">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
