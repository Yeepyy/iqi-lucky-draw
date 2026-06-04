'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface UserFormData {
  fullName: string;
  icPassport: string;
  phoneNumber: string;
  email: string;
  projectName: string;
  unitNumber: string;
  agentName: string;
}

export interface FormSettings {
  showIC?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showProject?: boolean;
  showUnit?: boolean;
  showAgent?: boolean;
}

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  hasSpun?: boolean;
  fixedAgentName?: string | null;
  formSettings?: FormSettings;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, isLoading = false, hasSpun = false, fixedAgentName = null, formSettings }) => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    icPassport: '',
    phoneNumber: '',
    email: '',
    projectName: '',
    unitNumber: '',
    agentName: fixedAgentName || '',
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const settings = formSettings || {
      showIC: true, showPhone: true, showEmail: true, showProject: true, showUnit: true, showAgent: true
    };

    if (!formData.fullName.trim()) return 'Full name is required';
    if (settings.showIC && !formData.icPassport.trim()) return 'IC/Passport number is required';
    if (settings.showPhone && !formData.phoneNumber.trim()) return 'Phone number is required';
    if (settings.showEmail && !formData.email.trim()) return 'Email is required';
    if (settings.showProject && !formData.projectName.trim()) return 'Project name is required';
    if (settings.showUnit && !formData.unitNumber.trim()) return 'Unit number is required';
    if (settings.showAgent && !formData.agentName.trim()) return 'Agent name is required';

    if (settings.showEmail && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return 'Please enter a valid email';
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  if (hasSpun) return null;

  const settings = formSettings || {
    showIC: true, showPhone: true, showEmail: true, showProject: true, showUnit: true, showAgent: true
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-red-600"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Register for Lucky Draw</h2>
      <p className="text-gray-600 mb-6">Please fill in your details to participate</p>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="Your full name"
            />
          </div>

          {settings.showIC !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IC / Passport No. *</label>
            <input
              type="text"
              name="icPassport"
              value={formData.icPassport}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="Your IC/Passport number"
            />
          </div>
          )}

          {settings.showPhone !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="Your phone number"
            />
          </div>
          )}

          {settings.showEmail !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="your.email@example.com"
            />
          </div>
          )}

          {settings.showProject !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="Property project name"
            />
          </div>
          )}

          {settings.showUnit !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit No. *</label>
            <input
              type="text"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              disabled={isLoading || hasSpun}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-100"
              placeholder="Unit number"
            />
          </div>
          )}

          {settings.showAgent !== false && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name *</label>
            <input
              type="text"
              name="agentName"
              value={formData.agentName}
              onChange={handleChange}
              disabled={isLoading || hasSpun || !!fixedAgentName}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-gray-200 disabled:text-gray-600 font-semibold"
              placeholder="Your agent's name"
            />
          </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading || hasSpun}
          whileHover={!isLoading && !hasSpun ? { scale: 1.02 } : {}}
          whileTap={!isLoading && !hasSpun ? { scale: 0.98 } : {}}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 ${
            isLoading || hasSpun
              ? 'bg-gray-400 cursor-not-allowed opacity-70'
              : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          {isLoading ? 'Processing...' : 'Start Lucky Draw'}
        </motion.button>
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center">
        * All fields are required. Each IC/Passport number can only spin once.
      </p>
    </motion.div>
  );
};

export default UserForm;
