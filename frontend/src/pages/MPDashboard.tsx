import React, { useEffect, useState } from 'react';
import { bursaryAPI, opportunitiesAPI, postsAPI, eventsAPI, Post, Event } from '../api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl } from '../api';
import {
  Plus, RefreshCw, Crown, BookOpen,
  Briefcase, ExternalLink, Calendar, Users, MapPin, Trash2
} from 'lucide-react';

const MPDashboard: React.FC<{ page: string }> = ({ page }) => {
  const { user, token }                       = useAuth();
  const [bursaryLinks,  setBursaryLinks]      = useState<any[]>([]);
  const [opportunities, setOpportunities]     = useState<Post[]>([]);
  const [events,        setEvents]            = useState<Event[]>([]);
  const [posts,         setPosts]             = useState<Post[]>([]);
  const [leaders,       setLeaders]           = useState<any[]>([]);
  const [loading,       setLoading]           = useState(true);
  const [success,       setSuccess]           = useState('');
  const [error,         setError]             = useState('');
  const [showBursaryForm, setShowBursaryForm] = useState(false);
  const [showJobForm,     setShowJobForm]     = useState(false);
  const [showPostForm,    setShowPostForm]    = useState(false);

  const [bursaryForm, setBursaryForm] = useState({ title: '', link: '', deadline: '', notes: '' });
  const [jobForm,     setJobForm]     = useState({ title: '', content: '', opp_type: 'job', apply_link: '', deadline: '' });
  const [postForm,    setPostForm]    = useState({ title: '', content: '', post_type: 'announcement' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, o, e, p, l] = await Promise.all([
        bursaryAPI.getLinks(),
        opportunitiesAPI.getAll(),
        eventsAPI.getAll(),
        postsAPI.getAll(),
        axios.get(`${getBaseUrl()}/leaders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setBursaryLinks(b.data);
      setOpportunities(o.data);
      setEvents(e.data);
      setPosts(p.data);
      setLeaders(l.data);
    } finally { setLoading(false); }
  };

  const showMsg = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000); };
  const showErr = (m: string) => { setError(m);   setTimeout(() => setError(''),   3000); };

  const handlePostBursary = async () => {
    if (!bursaryForm.title || !bursaryForm.link) { showErr('Title and link required'); return; }
    try {
      const form = new FormData();
      form.append('title', bursaryForm.title);
      form.append('link',  bursaryForm.link);
      if (bursaryForm.deadline) form.append('deadline', bursaryForm.deadline);
      if (bursaryForm.notes)    form.append('notes',    bursaryForm.notes);
      await bursaryAPI.postLink(form);
      showMsg('Bursary link posted!');
      setBursaryForm({ title: '', link: '', deadline: '', notes: '' });
      setShowBursaryForm(false);
      loadAll();
    } catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.content) { showErr('Fill required fields'); return; }
    try {
      const form = new FormData();
      form.append('title', jobForm.title);
      form.append('content', jobForm.content);
      form.append('opp_type', jobForm.opp_type);
      if (jobForm.apply_link) form.append('apply_link', jobForm.apply_link);
      if (jobForm.deadline)   form.append('deadline', jobForm.deadline);
      await opportunitiesAPI.create(form);
      showMsg('Opportunity posted!');
      setJobForm({ title: '', content: '', opp_type: 'job', apply_link: '', deadline: '' });
      setShowJobForm(false);
      loadAll();
    } catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handlePost = async () => {
    if (!postForm.title || !postForm.content) { showErr('Fill all fields'); return; }
    try {
      const form = new FormData();
      form.append('title',     postForm.title);
      form.append('content',   postForm.content);
      form.append('post_type', postForm.post_type);
      await postsAPI.create(form);
      showMsg('Announcement posted!');
      setPostForm({ title: '', content: '', post_type: 'announcement' });
      setShowPostForm(false);
      loadAll();
    } catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const parseBursaryLink = (content: string) => ({
    link:     (content.match(/BURSARY_LINK:(.+?)(\n|$)/)?.[1] || '').trim(),
    notes:    (content.match(/NOTES:(.+?)(\n|$)/)?.[1] || '').trim(),
    deadline: (content.match(/DEADLINE:(.+?)(\n|$)/)?.[1] || '').trim(),
  });

  const parseOpportunity = (content: string) => ({
    link:     (content.match(/APPLY_LINK:(.+?)(\n|$)/)?.[1] || '').trim(),
    deadline: (content.match(/DEADLINE:(.+?)(\n|$)/)?.[1] || '').trim(),
    type:     (content.match(/TYPE:(.+?)(\n|$)/)?.[1] || 'job').trim(),
    content:  content.replace(/APPLY_LINK:.+?(\n|$)/, '').replace(/DEADLINE:.+?(\n|$)/, '').replace(/TYPE:.+?(\n|$)/, '').trim(),
  });

  const headerBg = 'linear-gradient(135deg, #8b0000 0%, #cc2200 100%)';

  return (
    <div className="pb-24">
      <div className="px-4 pt-10 pb-4" style={{ background: headerBg }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white border-opacity-30">
            {user?.profile_photo
              ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-white bg-opacity-20"><Crown className="w-6 h-6 text-white" /></div>
            }
          </div>
          <div className="flex-1">
            <p className="text-red-200 text-xs font-medium">Member of Parliament</p>
            <h1 className="text-white font-bold text-lg leading-tight">Hon. {user?.full_name}</h1>
            <p className="text-red-200 text-xs">Mwala Constituency</p>
          </div>
          <button onClick={loadAll} className="w-9 h-9 bg-white bg-opacity-10 rounded-full flex items-center justify-center text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-3 border border-green-100">{success}</div>}
        {error   && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-3 border border-red-100">{error}</div>}

        {/* HOME */}
        {page === 'home' && (
          <>
            <button onClick={() => setShowPostForm(!showPostForm)}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-2xl text-white mb-4 font-semibold text-sm shadow-md"
              style={{ background: headerBg }}>
              <Plus className="w-4 h-4" />
              {showPostForm ? 'Cancel' : 'Post Announcement'}
            </button>
            {showPostForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                <select value={postForm.post_type} onChange={e => setPostForm(p => ({...p, post_type: e.target.value}))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3 bg-white">
                  <option value="announcement">📢 Announcement</option>
                  <option value="county_program">🏛️ County Program</option>
                </select>
                <input value={postForm.title} onChange={e => setPostForm(p => ({...p, title: e.target.value}))}
                  placeholder="Title *" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3" />
                <textarea value={postForm.content} onChange={e => setPostForm(p => ({...p, content: e.target.value}))}
                  placeholder="Write your message..." rows={4}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3 resize-none" />
                <button onClick={handlePost} className="w-full text-white py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#8b0000' }}>Publish Announcement</button>
              </div>
            )}
            {posts.filter(p => p.post_type !== 'opportunity').map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-gray-100">
                <div className="p-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 capitalize">
                    {post.post_type.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-gray-800 mt-2 mb-1">{post.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-3">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {/* JOBS */}
        {page === 'jobs' && (
          <>
            <button onClick={() => setShowJobForm(!showJobForm)}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-2xl text-white mb-4 font-semibold text-sm shadow-md"
              style={{ background: headerBg }}>
              <Plus className="w-4 h-4" />
              {showJobForm ? 'Cancel' : 'Post Job / Internship / Attachment'}
            </button>
            {showJobForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                <select value={jobForm.opp_type} onChange={e => setJobForm(p => ({...p, opp_type: e.target.value}))}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3 bg-white">
                  <option value="job">💼 Job</option>
                  <option value="internship">🎓 Internship</option>
                  <option value="attachment">📎 Attachment</option>
                </select>
                <input value={jobForm.title} onChange={e => setJobForm(p => ({...p, title: e.target.value}))}
                  placeholder="Title *" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3" />
                <textarea value={jobForm.content} onChange={e => setJobForm(p => ({...p, content: e.target.value}))}
                  placeholder="Description, requirements... *" rows={4}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3 resize-none" />
                <input value={jobForm.apply_link} onChange={e => setJobForm(p => ({...p, apply_link: e.target.value}))}
                  placeholder="Application link (optional)" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3" />
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">Deadline</label>
                  <input value={jobForm.deadline} onChange={e => setJobForm(p => ({...p, deadline: e.target.value}))}
                    type="date" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <button onClick={handlePostJob} className="w-full text-white py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#8b0000' }}>Post Opportunity</button>
              </div>
            )}
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No opportunities posted yet</p>
              </div>
            ) : opportunities.map(opp => {
              const parsed = parseOpportunity(opp.content);
              return (
                <div key={opp.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{opp.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">{parsed.content}</p>
                  {parsed.deadline && <p className="text-xs text-orange-600 font-semibold mb-2">⏰ {parsed.deadline}</p>}
                  {parsed.link && (
                    <a href={parsed.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2.5 rounded-xl w-full"
                      style={{ background: '#8b0000' }}>
                      Apply Now <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* BURSARY */}
        {page === 'bursary' && (
          <>
            <button onClick={() => setShowBursaryForm(!showBursaryForm)}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-2xl text-white mb-4 font-semibold text-sm shadow-md"
              style={{ background: headerBg }}>
              <Plus className="w-4 h-4" />
              {showBursaryForm ? 'Cancel' : 'Post Bursary Portal Link'}
            </button>
            {showBursaryForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
                <input value={bursaryForm.title} onChange={e => setBursaryForm(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. Mwala CDF Bursary 2025 *" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3" />
                <input value={bursaryForm.link} onChange={e => setBursaryForm(p => ({...p, link: e.target.value}))}
                  placeholder="Bursary portal link * (https://...)" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3" />
                <textarea value={bursaryForm.notes} onChange={e => setBursaryForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Requirements, documents needed, eligibility..." rows={3}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none mb-3 resize-none" />
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">Application Deadline</label>
                  <input value={bursaryForm.deadline} onChange={e => setBursaryForm(p => ({...p, deadline: e.target.value}))}
                    type="date" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <button onClick={handlePostBursary} className="w-full text-white py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#8b0000' }}>Post Bursary Link</button>
              </div>
            )}
            {bursaryLinks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No bursary links posted yet</p>
              </div>
            ) : bursaryLinks.map(b => {
              const p = parseBursaryLink(b.content);
              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
                  <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #8b0000, #c9a84c)' }} />
                  <div className="p-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">🎓 Bursary Portal</span>
                    <h3 className="font-bold text-gray-800 mt-2 mb-1">{b.title}</h3>
                    {p.notes && <p className="text-gray-500 text-sm mb-2">{p.notes}</p>}
                    {p.deadline && <p className="text-xs text-orange-600 font-semibold mb-2">⏰ Deadline: {p.deadline}</p>}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl w-full mt-2"
                        style={{ background: 'linear-gradient(135deg, #8b0000, #cc2200)' }}>
                        <ExternalLink className="w-4 h-4" /> Open Bursary Portal
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* EVENTS */}
        {page === 'events' && (
          events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No upcoming events</p>
            </div>
          ) : events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-1">{event.title}</h3>
              <p className="text-gray-500 text-sm mb-2">{event.description}</p>
              <p className="text-xs font-semibold" style={{ color: '#8b0000' }}>📍 {event.location}</p>
              <p className="text-xs text-gray-400 mt-1">📅 {new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          ))
        )}

        {/* LEADERS */}
        {page === 'leaders' && (
          leaders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No leaders yet</p>
            </div>
          ) : leaders.map((l: any) => (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl text-white shrink-0"
                  style={{ background: '#2d1b69' }}>
                  {l.profile_photo
                    ? <img src={l.profile_photo} alt={l.full_name} className="w-full h-full object-cover" />
                    : l.full_name?.[0]
                  }
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{l.full_name}</h3>
                  <p className="text-purple-600 text-sm font-semibold">{l.position || 'Chapter Leader'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-gray-400 text-xs">{l.ward}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MPDashboard;