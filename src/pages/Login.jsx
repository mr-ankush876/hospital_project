import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import VitalSyncLogo from '../components/common/VitalSyncLogo';
import PhoneNumberInput from '../components/common/PhoneNumberInput';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State (Strictly empty, no default credentials)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Register Form State (Always and exclusively PATIENT)
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

  const isPrivateAdminPortal = searchParams.get('portal') === 'admin';

  useEffect(() => {
    if (searchParams.get('tab') === 'register' && !isPrivateAdminPortal) {
      setActiveTab('register');
    }
  }, [searchParams, isPrivateAdminPortal]);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both your username and password.');
      return;
    }

    const result = await login(username.trim(), password);
    if (result.success) {
      if (result.isOfflineDemo) {
        toast.info(`Logged in as ${result.user?.fullName} (Offline Mode). Run start-windows.bat to connect to live DB.`);
      } else {
        toast.success(`Welcome back, ${result.user?.fullName || username}!`);
      }
      if (result.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (result.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!regForm.username.trim() || !regForm.fullName.trim() || !regForm.email.trim() || !regForm.phone.trim() || !regForm.password) {
      toast.error('Please complete all required fields.');
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
      toast.success('Registration successful! Welcome to the VitalSync Patient Portal.');
      navigate('/patient/dashboard');
    } else {
      toast.error(result.error || 'Registration failed.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please provide your registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: forgotEmail.trim() });
      toast.success(res.data?.message || 'Password reset token generated.');
      setResetTokenInfo(res.data?.resetToken);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to locate account with that email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must contain at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.resetPassword({ token: resetTokenInfo, newPassword });
      toast.success(res.data?.message || 'Password updated successfully! Please log in.');
      setForgotOpen(false);
      setResetTokenInfo(null);
      setForgotEmail('');
      setNewPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 selection:bg-primary/20">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Hospital Website</span>
        </Link>
        <div className="text-[11px] sm:text-xs text-on-surface-variant flex items-center gap-1.5 bg-surface px-3 py-1 rounded-full border border-outline-variant/50 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>256-Bit SSL Encrypted Healthcare Portal</span>
        </div>
      </div>

      <div className="w-full max-w-md sm:max-w-lg mx-auto space-y-6 my-auto py-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-3">
            <VitalSyncLogo className="w-14 h-14" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">VitalSync HMS</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            {isPrivateAdminPortal
              ? 'Hospital Administration & Executive Portal'
              : 'Clinical Precision Hospital & Patient Portal'}
          </p>
        </div>

        {/* Tab Switcher (Hidden in private admin portal mode) */}
        {!isPrivateAdminPortal && (
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
              Sign In
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
              New Patient Registration
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm p-6 sm:p-8">
          {activeTab === 'login' || isPrivateAdminPortal ? (
            <div>
              <div className="mb-6">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {isPrivateAdminPortal ? 'Admin Sign In' : 'Account Sign In'}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {isPrivateAdminPortal
                    ? 'Enter authorized executive credentials to access administrative systems.'
                    : 'Access your patient portal, doctor clinical queue, or staff desk.'}
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
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username or email"
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
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
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
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure password"
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
                  className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
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
                  Self-Service Patient Registration
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Create Patient Account</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Register for access to online appointment booking, digital prescriptions, and laboratory reports.
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
                    <PhoneNumberInput
                      label="Phone Number"
                      required
                      value={regForm.phone}
                      onChange={(val) => setRegForm({ ...regForm, phone: val })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
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
                      className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline cursor-pointer"
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
                  className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
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
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4 animate-scale-up">
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
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!resetTokenInfo ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-on-surface-variant">
                  Enter the email address registered with your hospital account. A secure recovery token will be verified.
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
                    placeholder="e.g. yourname@email.com"
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
        <p>© {new Date().getFullYear()} VitalSync HMS • Clinical Precision Hospital Management System</p>
      </div>
    </div>
  );
};

export default Login;
