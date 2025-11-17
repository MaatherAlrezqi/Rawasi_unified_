import React, { useState } from 'react';
import { requestService } from '../../services/requestService';
import { supabase } from '../../lib/supabaseClient';

const SendRequestModal = ({ provider, project, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to send a request');
      }

      // Check if request already exists
      const exists = await requestService.requestExists(
        project.id,
        provider.id,
        user.id
      );

      if (exists) {
        throw new Error('You already have a pending request with this provider for this project');
      }

      const requestData = {
        projectId: project.id,
        projectOwnerId: user.id,
        providerId: provider.id,
        projectTitle: project.title,
        projectDescription: project.description,
        budget: project.budget,
        timeline: project.timeline,
        message: message
      };

      await requestService.createRequest(requestData);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error sending request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Send Request to Provider</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Provider Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Provider Details</h3>
          <p className="text-gray-700 font-medium">{provider.name}</p>
          {provider.specialty && (
            <p className="text-gray-600 text-sm">{provider.specialty}</p>
          )}
          {provider.email && (
            <p className="text-gray-600 text-sm">{provider.email}</p>
          )}
        </div>

        {/* Project Details */}
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
          <p className="text-gray-700 font-medium">{project.title}</p>
          {project.description && (
            <p className="text-gray-600 text-sm mt-1">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {project.budget && (
              <span className="text-gray-600">
                Budget: <span className="font-medium text-orange-600">${project.budget.toLocaleString()}</span>
              </span>
            )}
            {project.timeline && (
              <span className="text-gray-600">
                Timeline: <span className="font-medium text-orange-600">{project.timeline}</span>
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              rows="4"
              placeholder="Add any additional information, specific requirements, or questions for the provider..."
            />
            <p className="text-sm text-gray-500 mt-1">
              This message will be sent along with your project details to the provider.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendRequestModal;
