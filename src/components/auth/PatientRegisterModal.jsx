import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PhoneNumberInput from '../common/PhoneNumberInput';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PatientRegisterModal = ({ onSuccess, onCancel, isModal = false }) => {
  const { registerPatient, loading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phone: '+91 ',
    bloodGroup: 'O+',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Inline Validation Checks
  const validation = useMemo(() => {
    const fn = formData.firstName.trim();
    const ln = formData.lastName.trim();
    const email = formData.email.trim();
    const dob = formData.dob;
    const phone = formData.phone.trim();
    const bg = formData.bloodGroup;
    const pwd = formData.password;
    const confirmPwd = formData.confirmPassword;

    const fnValid = fn.length > 0 && fn.length <= 50 && /^[A-Za-z\s'\-]+$/.test(fn) && !/^\d+$/.test(fn);
    const lnValid = ln.length > 0 && ln.length <= 50 && /^[A-Za-z\s'\-]+$/.test(ln) && !/^\d+$/.test(ln);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    let dobValid = false;
    let computedAge = null;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      if (birthDate <= today) {
        dobValid = true;
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        computedAge = age >= 0 ? age : 0;
      }
    }

    const phoneDigits = phone.replace(/\D/g, '');
    const phoneValid = phoneDigits.length >= 7;
    const bloodGroupValid = BLOOD_GROUPS.includes(bg);

    // Password criteria
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&#^()_\-+=]/.test(pwd);

    const passwordValid = hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial;
    const confirmMatch = pwd.length > 0 && pwd === confirmPwd;

    // Strength calculation (0 to 4)
    let score = 0;
    if (hasMinLen) score++;
    if (hasUpper && hasLower) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    const isFormValid = fnValid && lnValid && emailValid && dobValid && phoneValid && bloodGroupValid && passwordValid && confirmMatch;

    return {
      fnValid,
      lnValid,
      emailValid,
      dobValid,
      computedAge,
      phoneValid,
      bloodGroupValid,
      hasMinLen,
      hasUpper,
      hasLower,
      hasDigit,
      hasSpecial,
      passwordValid,
      confirmMatch,
      score,
      isFormValid,
    };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.isFormValid) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      dob: formData.dob,
      phone: formData.phone.trim(),
      bloodGroup: formData.bloodGroup,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    const result = await registerPatient(payload);
    if (result.success) {
      toast.success('Patient account created successfully! Please sign in with your email.');
      if (onSuccess) {
        onSuccess(payload.email);
      }
    } else {
      toast.error(result.error || 'Registration failed. Please check your information.');
    }
  };

  const getStrengthBar = () => {
    const s = validation.score;
    if (formData.password.length === 0) return null;
    if (s <= 1) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/3', text: 'text-rose-500' };
    if (s <= 3) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full', text: 'text-emerald-500' };
  };

  const strength = getStrengthBar();

  return (
    <div className={isModal ? 'bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant shadow-2xl max-w-xl w-full mx-auto animate-scale-up' : 'space-y-4'}>
      {/* Form Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary mb-1.5">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Self-Service Patient Registration (8 Fields)
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl font-extrabold text-on-surface">New Patient Registration</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Create your confidential VitalSync account with Email & Password.
          </p>
        </div>
        {isModal && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-outline hover:text-on-surface rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* 1. First Name & 2. Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              onBlur={() => handleBlur('firstName')}
              placeholder="e.g. Alexander"
              className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                touched.firstName && !validation.fnValid
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {touched.firstName && !validation.fnValid && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                First name must contain letters only (max 50 chars).
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              onBlur={() => handleBlur('lastName')}
              placeholder="e.g. Fleming"
              className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                touched.lastName && !validation.lnValid
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {touched.lastName && !validation.lnValid && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                Last name must contain letters only (max 50 chars).
              </p>
            )}
          </div>
        </div>

        {/* 3. Email Address */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Email Address (Your Login Username) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
              mail
            </span>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => handleBlur('email')}
              placeholder="patient@example.com"
              className={`w-full pl-9 pr-3.5 py-2.5 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                touched.email && !validation.emailValid
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
          </div>
          {touched.email && !validation.emailValid && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              Please enter a valid email address (e.g. user@domain.com).
            </p>
          )}
        </div>

        {/* 4. Date of Birth & 6. Blood Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              {validation.computedAge !== null && (
                <span className="text-[11px] text-primary font-semibold">
                  Age: {validation.computedAge} yrs
                </span>
              )}
            </div>
            <input
              type="date"
              required
              max={todayStr}
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              onBlur={() => handleBlur('dob')}
              className={`w-full px-3 py-2 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                touched.dob && !validation.dobValid
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {touched.dob && !validation.dobValid && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                Please select a valid past or present date.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Blood Group <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Blood Type {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Phone Number */}
        <div>
          <PhoneNumberInput
            label="Phone Number"
            required
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            onBlur={() => handleBlur('phone')}
          />
          {touched.phone && !validation.phoneValid && (
            <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              Please enter a valid phone number with country code.
            </p>
          )}
        </div>

        {/* 7. Password & 8. Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full pl-3.5 pr-9 py-2.5 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                  touched.password && !validation.passwordValid
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                className={`w-full pl-3.5 pr-9 py-2.5 bg-surface border rounded-xl text-xs text-on-surface focus:outline-none transition-all ${
                  touched.confirmPassword && !validation.confirmMatch
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : validation.confirmMatch
                    ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-sm">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {formData.confirmPassword && (
              <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                validation.confirmMatch ? 'text-emerald-600' : 'text-rose-500'
              }`}>
                <span className="material-symbols-outlined text-xs">
                  {validation.confirmMatch ? 'check_circle' : 'cancel'}
                </span>
                {validation.confirmMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        {/* Live Password Strength Meter */}
        {strength && (
          <div className="space-y-1.5 p-2.5 bg-surface rounded-xl border border-outline-variant/60">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-on-surface-variant">Password Strength:</span>
              <span className={`font-bold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1 text-[10px]">
              <span className={`flex items-center gap-0.5 ${validation.hasMinLen ? 'text-emerald-600 font-bold' : 'text-outline'}`}>
                {validation.hasMinLen ? '✓' : '○'} 8+ Chars
              </span>
              <span className={`flex items-center gap-0.5 ${validation.hasUpper && validation.hasLower ? 'text-emerald-600 font-bold' : 'text-outline'}`}>
                {validation.hasUpper && validation.hasLower ? '✓' : '○'} Upper & Lower
              </span>
              <span className={`flex items-center gap-0.5 ${validation.hasDigit ? 'text-emerald-600 font-bold' : 'text-outline'}`}>
                {validation.hasDigit ? '✓' : '○'} 1+ Number
              </span>
              <span className={`flex items-center gap-0.5 ${validation.hasSpecial ? 'text-emerald-600 font-bold' : 'text-outline'}`}>
                {validation.hasSpecial ? '✓' : '○'} 1+ Symbol
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !validation.isFormValid}
          className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Complete Patient Registration</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PatientRegisterModal;
