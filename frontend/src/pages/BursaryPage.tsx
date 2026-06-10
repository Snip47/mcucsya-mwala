import React, { useEffect, useState } from 'react';
import { bursaryAPI, BursaryAnnouncement, BursaryApplication } from '../api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

const BursaryPage: React.FC = () => {
  const { user, isMPOrAdmin }                       = useAuth();
  const [announcements, setAnnouncements]           = useState<BursaryAnnouncement[]>([]);
  const [myApplications, setMyApplications]         = useState<BursaryApplication[]>([]);
  const [tab, setTab]                               = useState<'announcements' | 'apply' | 'my'>('announcements');
  const [loading, setLoading]                       = useState(true);
  const [submitting, setSubmitting]                 = useState(false);
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState('');
  const [showAnnounceForm, setShowAnnounceForm]     = useState(false);

  const [appForm, setAppForm] = useState({
    institution: user?.institution || '',
    course: '', year_of_study: '', amount_requested: '', reason: ''
  });

  const [annForm, setAnnForm] = useState({
    title: '', content: '', amount: '', deadline: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ann, apps] = await Promise.all([
        bursaryAPI.getAnnouncements(),
        bursaryAPI.getMyApplications()
      ]);
      setAnnouncements(ann.data);
      setMyApplications(apps.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!appForm.institution || !appForm.course || !appForm.year_of_study || !appForm.amount_requested || !appForm.reason) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      Object.entries(appForm).forEach(([k, v]) => form.append(k, v));
      await bursaryAPI.apply(form);
      setSuccess('Bursary application submitted successfully!');
      setTab('my');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnnounce = async () => {
    if (!annForm.title || !annForm.content) {
      setError('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(annForm).forEach(([k, v]) => { if (v) form.append(k, v); });
      await bursaryAPI.createAnnouncement(form);
      setShowAnnounceForm(false);
      setAnnForm({ title: '', content: '', amount: '', deadline: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="pb-24">
      <div className="bg-green-700 px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-white" />
          <div>
            <h1 className="text-white font-bold text-lg">Bursary</h1>
            <p className="text-green-200 text-xs">Education funding for Mwala youth</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          {[
            { id: 'announcements', label: 'Updates' },
            { id: 'apply',         label: 'Apply' },
            { id: 'my',            label: 'My Applications' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as any); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                tab === t.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-3 py-2 mb-3">{success}</div>}

        {/* Announcements tab */}
        {tab === 'announcements' && (
          <>
            {isMPOrAdmin && (
              <button
                onClick={() => setShowAnnounceForm(!showAnnounceForm)}
                className="w-full flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Post Bursary Announcement
              </button>
            )}

            {showAnnounceForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-green-100">
                <input
                  value={annForm.title}
                  onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                />
                <textarea
                  value={annForm.content}
                  onChange={e => setAnnForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Bursary details, requirements, how to apply..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3 resize-none"
                />
                <input
                  value={annForm.amount}
                  onChange={e => setAnnForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Amount available (KES)"
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                />
                <input
                  value={annForm.deadline}
                  onChange={e => setAnnForm(p => ({ ...p, deadline: e.target.value }))}
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                />
                <button
                  onClick={handleAnnounce}
                  disabled={submitting}
                  className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            )}

            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No bursary announcements yet</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
                  {ann.image_url && <img src={ann.image_url} alt={ann.title} className="w-full h-40 object-cover rounded-xl mb-3" />}
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Bursary</span>
                  <h3 className="font-bold text-gray-800 mt-2 mb-1">{ann.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{ann.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>🏛️ MP · {ann.author_name}</span>
                    {ann.amount && <span className="text-green-600 font-medium">KES {ann.amount.toLocaleString()}</span>}
                  </div>
                  {ann.deadline && (
                    <p className="text-xs text-orange-600 mt-1">⏰ Deadline: {new Date(ann.deadline).toLocaleDateString()}</p>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* Apply tab */}
        {tab === 'apply' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Bursary Application Form</h3>
            <div className="space-y-3">
              <input
                value={appForm.institution}
                onChange={e => setAppForm(p => ({ ...p, institution: e.target.value }))}
                placeholder="Institution name *"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
              />
              <input
                value={appForm.course}
                onChange={e => setAppForm(p => ({ ...p, course: e.target.value }))}
                placeholder="Course/Program *"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
              />
              <select
                value={appForm.year_of_study}
                onChange={e => setAppForm(p => ({ ...p, year_of_study: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
              >
                <option value="">Year of study *</option>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <input
                value={appForm.amount_requested}
                onChange={e => setAppForm(p => ({ ...p, amount_requested: e.target.value }))}
                placeholder="Amount requested (KES) *"
                type="number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
              />
              <textarea
                value={appForm.reason}
                onChange={e => setAppForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Why do you need this bursary? Explain your financial situation... *"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              />
              <button
                onClick={handleApply}
                disabled={submitting}
                className="w-full bg-green-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}

        {/* My applications tab */}
        {tab === 'my' && (
          <>
            {myApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No applications yet</p>
                <button onClick={() => setTab('apply')} className="mt-3 text-green-700 text-sm font-medium">
                  Apply now →
                </button>
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">{app.institution}</span>
                    <div className="flex items-center gap-1">
                      {statusIcon(app.status)}
                      <span className={`text-xs font-medium capitalize ${
                        app.status === 'approved' ? 'text-green-600' :
                        app.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>{app.status}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">{app.course} · Year {app.year_of_study}</p>
                  <p className="text-green-600 text-sm font-medium mt-1">KES {app.amount_requested?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BursaryPage;