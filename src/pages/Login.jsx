import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);

  // Register Form State (Always PATIENT)
  const [regForm, setRegForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    bloodGroup: 'O+',
    dob: '1995-05-15',
    address: '',
    emergencyContact: '',
  });
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, registerPatient, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    const result = await login(username.trim(), password);
    if (result.success) {
      toast.success(`Welcome back, ${result.user?.fullName || username}!`);
      if (result.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (result.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    login(u, p).then((result) => {
      if (result.success) {
        toast.success(`Welcome, ${result.user?.fullName || u}!`);
        if (result.role === 'PATIENT') {
          navigate('/patient/dashboard');
        } else if (result.role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!regForm.username.trim() || !regForm.fullName.trim() || !regForm.email.trim() || !regForm.phone.trim() || !regForm.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (regForm.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      username: regForm.username.trim(),
      fullName: regForm.fullName.trim(),
      email: regForm.email.trim(),
      phone: regForm.phone.trim(),
      password: regForm.password,
      gender: regForm.gender,
      bloodGroup: regForm.bloodGroup,
      dob: regForm.dob,
      address: regForm.address,
      emergencyContact: regForm.emergencyContact || regForm.phone,
    };

    const result = await registerPatient(payload);
    if (result.success) {
      toast.success('Registration successful! Welcome to VitalSync Patient Portal.');
      navigate('/patient/dashboard');
    } else {
      toast.error(result.error || 'Registration failed.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: forgotEmail.trim() });
      toast.success(res.data?.message || 'Reset token generated.');
      setResetTokenInfo(res.data?.resetToken);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.resetPassword({ token: resetTokenInfo, newPassword });
      toast.success(res.data?.message || 'Password reset successfully!');
      setForgotOpen(false);
      setResetTokenInfo(null);
      setForgotEmail('');
      setNewPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Password reset failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const demoCredentials = [
    { label: 'Administrator', username: 'Ankush876', role: 'ADMIN', name: 'Dr. Ankush Kumar', color: 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10' },
    { label: 'Attending Doctor', username: 'dr.chen', role: 'DOCTOR', name: 'Dr. Robert Chen (Cardiology)', color: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' },
    { label: 'Reception Desk', username: 'receptionist', role: 'RECEPTIONIST', name: 'Alex Vance', color: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100' },
    { label: 'Patient Portal', username: 'patient.michael', role: 'PATIENT', name: 'Michael Chang (Patient)', color: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 selection:bg-primary/20">
      {/* Top Bar back to home */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Hospital Website</span>
        </Link>
        <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>256-Bit SSL Encrypted Healthcare Portal</span>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto space-y-6 my-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-3">
            <VitalSyncLogo className="w-14 h-14" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">VitalSync HMS</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Clinical Precision Hospital & Patient Portal</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1 border border-outline-variant shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Patient Registration
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 sm:p-8">
          {activeTab === 'login' ? (
            <div>
              <div className="mb-5">
                <h2 className="font-headline-md text-headline-md text-on-surface">Sign In</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Access patient records, doctor clinical tools, or administration.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                      account_circle
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (e.g. admin, dr.chen, patient.michael)"
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                      lock
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-11 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1 cursor-pointer"
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
                  className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sign In to Healthcare Portal &rarr;</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary mb-2">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Self-Service Patient Account
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">New Patient Registration</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Create your personal patient portal account for online appointments, prescriptions, and lab reports.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                      placeholder="e.g. john.doe99"
                      className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={regForm.dob}
                      onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                      className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Gender
                    </label>
                    <select
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                      className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Blood Group
                    </label>
                    <select
                      value={regForm.bloodGroup}
                      onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                      className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showRegPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-3 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Complete Patient Registration &rarr;</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 1-Click Fast Direct Testing Panel */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">bolt</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">1-Click Direct Role Testing</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.username}
                type="button"
                onClick={() => handleQuickLogin(cred.username, 'password123')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${cred.color}`}
              >
                <div>
                  <p className="text-xs font-bold text-on-surface">{cred.name}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono">{cred.username}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/80 border border-current shadow-xs">
                    {cred.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">lock_reset</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Account Recovery</h3>
              </div>
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setResetTokenInfo(null);
                }}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!resetTokenInfo ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-on-surface-variant">
                  Enter the email address registered with your account. A secure 30-minute recovery token will be generated.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. michael.chang@email.com"
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-container text-xs cursor-pointer"
                >
                  {forgotLoading ? 'Verifying...' : 'Generate Recovery Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <p className="font-bold">Token verified successfully!</p>
                  <p className="font-mono text-[11px] break-all mt-1">Token: {resetTokenInfo}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Enter New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 text-xs cursor-pointer"
                >
                  {resetLoading ? 'Saving...' : 'Set New Password & Complete'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-xs text-on-surface-variant pb-2">
        <p>© {new Date().getFullYear()} VitalSync HMS • Clinical Precision Hospital & Healthcare Network</p>
      </div>
    </div>
  );
};

export default Login;
