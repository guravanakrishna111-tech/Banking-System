import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function UserLogin({ onSwitchToRegister, onSwitchToForgot, onSwitchToAdmin }) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usernameOrEmail.trim(), password);
    } catch (err) {
      if (!err.response) {
        setError(`Cannot connect to backend server. Please verify backend status and CORS configuration.`);
      } else {
        const msg = err.response?.data?.non_field_errors?.[0] || 
                    err.response?.data?.detail || 
                    'Invalid credentials. Please verify your username and password.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (user, pass) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Building2 className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Apex Online Banking
        </h2>
        <p className="mt-1 text-center text-xs text-blue-200">
          Secure Customer Portal • Academic Banking Simulation
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Registered Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. john_doe or john@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Demo Accounts</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('john_doe', 'password123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-left transition text-[11px]"
              >
                <div className="font-bold">John Doe</div>
                <div className="text-[10px] text-slate-400">john_doe / password123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('alice_smith', 'password123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-left transition text-[11px]"
              >
                <div className="font-bold">Alice Smith</div>
                <div className="text-[10px] text-slate-400">alice_smith / password123</div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an online banking account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              Register Now
            </button>
          </div>

          {/* Admin Portal Link */}
          <div className="mt-3 text-center">
            <button
              onClick={onSwitchToAdmin}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition"
            >
              Switch to Bank Administrator Portal &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
