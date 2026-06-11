import React, { useEffect, useState } from 'react';
import { postsAPI, Post } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Plus, RefreshCw, Bell } from 'lucide-react';

const POST_TYPES = [
  { value: '',               label: 'All' },
  { value: 'announcement',   label: 'Announcements' },
  { value: 'bursary',        label: 'Bursary' },
  { value: 'mentorship',     label: 'Mentorship' },
  { value: 'opportunity',    label: 'Opportunities' },
  { value: 'county_program', label: 'County' },
];

const LEADER_POST_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'mentorship',   label: 'Mentorship' },
  { value: 'opportunity',  label: 'Opportunity' },
  { value: 'event_info',   label: 'Event Info' },
];

const MP_POST_TYPES = [
  { value: 'bursary',        label: 'Bursary Update' },
  { value: 'announcement',   label: 'Announcement' },
  { value: 'county_program', label: 'County Program' },
  { value: 'opportunity',    label: 'Opportunity' },
];

const HomePage: React.FC = () => {
  const { user, isLeaderOrAbove } = useAuth();
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [filter,     setFilter]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState('');

  const [newPost, setNewPost] = useState({
    title:     '',
    content:   '',
    post_type: '',
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getAll(filter || undefined);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [filter]);

  const handleCreate = async () => {
    if (!newPost.title || !newPost.content || !newPost.post_type) {
      setError('Please fill in all fields');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title',     newPost.title);
      form.append('content',   newPost.content);
      form.append('post_type', newPost.post_type);
      await postsAPI.create(form);
      setShowCreate(false);
      setNewPost({ title: '', content: '', post_type: '' });
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postsAPI.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const postTypes = user?.role === 'mp' || user?.role === 'admin' ? MP_POST_TYPES : LEADER_POST_TYPES;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-green-200 text-sm">Welcome back,</p>
            <h1 className="text-white font-bold text-lg">{user?.full_name?.split(' ')[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadPosts} className="text-white">
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-green-600 rounded-xl px-3 py-2 mt-3">
          <p className="text-green-100 text-xs">🌍 Mwala Constituency · {user?.ward}</p>
          <p className="text-white text-sm font-medium mt-0.5">Unity · Progress · Youth Empowerment</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {POST_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === type.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Create post button for leaders/MP */}
        {isLeaderOrAbove && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? 'Cancel' : 'Create new post'}
          </button>
        )}

        {/* Create post form */}
        {showCreate && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-green-100">
            <h3 className="font-semibold text-gray-800 mb-3">New Post</h3>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>
            )}

            <select
              value={newPost.post_type}
              onChange={e => setNewPost(prev => ({ ...prev, post_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3 bg-white"
            >
              <option value="">Select post type</option>
              {postTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <input
              value={newPost.title}
              onChange={e => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Post title"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
            />

            <textarea
              value={newPost.content}
              onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your message here..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-3 resize-none"
            />

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {creating ? 'Posting...' : 'Post'}
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No posts yet</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              canDelete={isLeaderOrAbove}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;