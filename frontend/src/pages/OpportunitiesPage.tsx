import React, { useEffect, useState } from 'react';
import { postsAPI, Post } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Briefcase, RefreshCw, Plus } from 'lucide-react';

const OpportunitiesPage: React.FC = () => {
  const { isLeaderOrAbove }           = useAuth();
  const [posts,     setPosts]         = useState<Post[]>([]);
  const [loading,   setLoading]       = useState(true);
  const [showForm,  setShowForm]      = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error,     setError]         = useState('');
  const [form, setForm]               = useState({ title: '', content: '', post_type: 'opportunity' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getAll('opportunity');
      setPosts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) { setError('Fill all fields'); return; }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('content', form.content);
      data.append('post_type', 'opportunity');
      await postsAPI.create(data);
      setShowForm(false);
      setForm({ title: '', content: '', post_type: 'opportunity' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-green-700 px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-white" />
          <div>
            <h1 className="text-white font-bold text-lg">Opportunities</h1>
            <p className="text-green-200 text-xs">Jobs, internships and attachments</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLeaderOrAbove && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Post Opportunity'}
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-green-100">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
            <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Opportunity title" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3" />
            <textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} placeholder="Details about the opportunity..." rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-3" />
            <button onClick={handleCreate} disabled={submitting} className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold">
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No opportunities posted yet</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} canDelete={isLeaderOrAbove} />
          ))
        )}
      </div>
    </div>
  );
};

export default OpportunitiesPage;