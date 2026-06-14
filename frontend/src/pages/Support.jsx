import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import { HelpCircle, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

const Support = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both the subject and the message.');
      return;
    }

    if (!user && (!name.trim() || !email.trim())) {
      setError('Name and email are required for guest submissions.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      subject: subject.trim(),
      message: message.trim(),
    };

    if (!user) {
      payload.name = name.trim();
      payload.email = email.trim();
    }

    try {
      await api.post('/api/support/', payload);
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Form Container */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-4">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted!</h1>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                Thank you for reaching out. We have logged your request and our support team will get back to you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
                  <p className="text-sm text-gray-500">Need help? Send us a ticket and we will look into it.</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Guest User Fields */}
                {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guest-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Your Name
                      </label>
                      <input
                        id="guest-name"
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                        placeholder="e.g. Alok Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="guest-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="guest-email"
                        type="email"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                        placeholder="e.g. alok@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label htmlFor="ticket-subject" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                    placeholder="Brief summary of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="ticket-message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Describe your issue
                  </label>
                  <textarea
                    id="ticket-message"
                    rows="5"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900 resize-none"
                    placeholder="Provide detailed description of what you need help with..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Support;
