import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLoginWith = async (userToLogin, passToLogin) => {
    const finalUser = userToLogin || 'admin';
    const result = await login(finalUser, passToLogin || '123');
    
    if (result.success) {
      toast.success(`Welcome, ${result.user?.fullName || finalUser}!`);
      navigate('/dashboard');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginWith(username, password);
  };

  const demoCredentials = [
    { label: 'Administrator', username: 'admin', role: 'ADMIN', name: 'Dr. Sarah Mitchell (Full Access)', color: 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10' },
    { label: 'Attending Doctor', username: 'dr.chen', role: 'DOCTOR', name: 'Dr. Robert Chen', color: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' },
    { label: 'Reception Desk', username: 'receptionist', role: 'RECEPTIONIST', name: 'Alex Vance', color: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-3">
            <VitalSyncLogo className="w-14 h-14" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">VitalSync HMS</h1>
          <p className="text-on-surface-variant text-sm mt-1">Clinical Precision & Hospital Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Quick Sign In</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Enter any text or click below to login instantly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  account_circle
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Type anything (e.g. admin, dr.chen, user)"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  lock
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type anything"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
            >
              <span>Instant Sign In &rarr;</span>
            </button>
          </form>
        </div>

        {/* 1-Click Fast Login Helper */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">bolt</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">1-Click Direct Access</h3>
          </div>
          <div className="space-y-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.username}
                type="button"
                onClick={() => handleLoginWith(cred.username, '123')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${cred.color}`}
              >
                <div>
                  <p className="text-xs font-bold text-on-surface">{cred.name}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono">{cred.username} (Click to enter)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/80 border border-current shadow-xs">
                    {cred.role}
                  </span>
                  <span className="text-xs font-semibold underline text-primary">Login &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
