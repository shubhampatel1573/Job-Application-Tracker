/**
 * pages/Profile.jsx
 * ==================
 * User profile and settings page.
 * Allows editing name, email, and changing password.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';

/**
 * Field wrapper — defined OUTSIDE the component so React doesn't
 * recreate it on every render, which would unmount inputs and lose focus.
 */
const Field = ({ label, name, errors, required, children }) => (
  <div>
    <label htmlFor={name} className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {errors?.[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
  </div>
);

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);

  // ---- Profile update ----
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) setProfileErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.first_name.trim()) errs.first_name = 'First name is required';
    if (!profileForm.email.trim()) errs.email = 'Email is required';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true);
    try {
      const res = await authService.updateProfile(profileForm);
      updateUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') setProfileErrors(data);
      else toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // ---- Password change ----
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.old_password) errs.old_password = 'Current password is required';
    if (!passwordForm.new_password) errs.new_password = 'New password is required';
    if (passwordForm.new_password.length < 8) errs.new_password = 'Must be at least 8 characters';
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }

    setPasswordLoading(true);
    try {
      await authService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      if (data?.old_password) setPasswordErrors({ old_password: data.old_password[0] || 'Incorrect password' });
      else if (data?.new_password) setPasswordErrors({ new_password: data.new_password[0] });
      else toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };


  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
          </p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <p className="text-gray-400 text-xs mt-1">@{user?.username}</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" name="first_name" errors={profileErrors} required>
              <input
                id="first_name"
                name="first_name"
                className="input"
                value={profileForm.first_name}
                onChange={handleProfileChange}
              />
            </Field>
            <Field label="Last Name" name="last_name" errors={profileErrors}>
              <input
                id="last_name"
                name="last_name"
                className="input"
                value={profileForm.last_name}
                onChange={handleProfileChange}
              />
            </Field>
          </div>
          <Field label="Email Address" name="email" errors={profileErrors} required>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              value={profileForm.email}
              onChange={handleProfileChange}
            />
          </Field>
          <div>
            <label className="label">Username</label>
            <input
              className="input bg-gray-50 text-gray-400 cursor-not-allowed"
              value={user?.username || ''}
              readOnly
              title="Username cannot be changed"
            />
            <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              id="save-profile"
              type="submit"
              disabled={profileLoading}
              className="btn-primary"
            >
              <Save size={16} />
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Current Password" name="old_password" errors={passwordErrors} required>
            <div className="relative">
              <input
                id="old_password"
                name="old_password"
                type={showPasswords ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Enter your current password"
                value={passwordForm.old_password}
                onChange={handlePasswordChange}
              />
            </div>
          </Field>
          <Field label="New Password" name="new_password" errors={passwordErrors} required>
            <div className="relative">
              <input
                id="new_password"
                name="new_password"
                type={showPasswords ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Minimum 8 characters"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
              />
            </div>
          </Field>
          <Field label="Confirm New Password" name="confirm_password" errors={passwordErrors} required>
            <div className="relative">
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPasswords ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Re-enter new password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
              />
            </div>
          </Field>
          <div className="flex items-center gap-2">
            <input
              id="show-passwords"
              type="checkbox"
              checked={showPasswords}
              onChange={() => setShowPasswords(!showPasswords)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="show-passwords" className="text-sm text-gray-600 cursor-pointer flex items-center gap-1">
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPasswords ? 'Hide' : 'Show'} passwords
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button
              id="change-password-btn"
              type="submit"
              disabled={passwordLoading}
              className="btn-primary"
            >
              <Lock size={16} />
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900 font-medium">
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Account status</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
