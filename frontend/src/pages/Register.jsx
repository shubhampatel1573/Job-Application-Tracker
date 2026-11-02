/**
 * pages/Register.jsx
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BrainCircuit, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Reusable field — defined OUTSIDE the component so React keeps the same
 * reference on every render. Closures over formData/errors/handleChange
 * are replaced with explicit props.
 */
const RegisterField = ({ name, label, type = 'text', placeholder, autoComplete, value, onChange, error }) => (
  <div>
    <label className="label">{label}</label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
    {error && (
      <p className="text-red-500 text-xs mt-1">
        {Array.isArray(error) ? error[0] : error}
      </p>
    )}
  </div>
);

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.username) errs.username = 'Username is required';
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.password_confirm) errs.password_confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created! Welcome to JobTracker!');
      navigate('/dashboard');
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        setErrors(errData);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 mt-1">Start tracking your job search today</p>
        </div>

        <div className="card p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <RegisterField
                name="first_name" label="First Name" placeholder="John"
                autoComplete="given-name" value={formData.first_name}
                onChange={handleChange} error={errors.first_name}
              />
              <RegisterField
                name="last_name" label="Last Name" placeholder="Doe"
                autoComplete="family-name" value={formData.last_name}
                onChange={handleChange} error={errors.last_name}
              />
            </div>

            <RegisterField
              name="username" label="Username" placeholder="johndoe"
              autoComplete="username" value={formData.username}
              onChange={handleChange} error={errors.username}
            />

            <RegisterField
              name="email" label="Email Address" type="email"
              placeholder="john@example.com" autoComplete="email"
              value={formData.email} onChange={handleChange} error={errors.email}
            />

            {/* Password — custom markup for show/hide toggle */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="password_confirm" className="label">Confirm Password</label>
              <input
                id="password_confirm"
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className={`input ${errors.password_confirm ? 'border-red-400' : ''}`}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {errors.password_confirm && (
                <p className="text-red-500 text-xs mt-1">{errors.password_confirm}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus size={18} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
