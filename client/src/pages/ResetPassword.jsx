import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordValid = password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canSubmit) return;
    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess('Password updated successfully. You can now login with your new password.');
      setTimeout(() => navigate('/login?reset=success'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-200 shadow-xl p-6">
        <div className="mb-6">
          <Logo size="large" clickable={false} className="auth-logo" />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new password for your DevConnect account.</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg text-sm bg-green-100 text-green-700">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg outline-none bg-white"
                placeholder="........"
                required
              />
              <span
                role="button"
                tabIndex={0}
                onClick={() => setShowPassword((prev) => !prev)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPassword((prev) => !prev)}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
            </div>
            <p className={`text-xs ${password.length === 0 ? 'text-gray-400' : passwordValid ? 'text-green-600' : 'text-red-500'}`}>
              {password.length === 0 ? 'Use at least 8 characters' : passwordValid ? 'Password length is valid' : 'Password must be at least 8 characters'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg outline-none bg-white"
                placeholder="........"
                required
              />
              <span
                role="button"
                tabIndex={0}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowConfirmPassword((prev) => !prev)}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0073b1] transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
            </div>
            <p className={`text-xs ${confirmPassword.length === 0 || passwordsMatch ? 'text-gray-500' : 'text-red-500'}`}>
              {confirmPassword.length === 0 ? 'Re-enter password to confirm' : passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`auth-primary-btn w-full flex justify-center items-center gap-2 py-3 rounded-full text-white font-semibold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Back to <Link to="/login" className="text-[#0073b1] font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
