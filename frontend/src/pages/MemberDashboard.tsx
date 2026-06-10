import React, { useEffect, useState } from 'react';
import { postsAPI, opportunitiesAPI, bursaryAPI, eventsAPI, Post, Event } from '../api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  RefreshCw, Bell, Briefcase,
  BookOpen, ExternalLink, Calendar, MapPin,
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

const MemberDashboard: React.FC<{ page: string }> = ({ page }) => {
  const { user, token }                   = useAuth();
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [opportunities, setOpportunities] = useState<Post[]>([]);
  const [bursaryLinks,  setBursaryLinks]  = useState<any[]>([]);
  const [events,        setEvents]        = useState<Event[]>([]);
  const [leaders,       setLeaders]       = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [rsvpd,         setRsvpd]         = useState<number[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, o, b, e, l] = await Promise.all([
        postsAPI.getAll(),
        opportunitiesAPI.getAll(),
        bursaryAPI.getLinks(),
        eventsAPI.getAll(),
        axios.get(`${BASE_URL}/leaders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPosts(p.data);
      setOpportunities(o.data);
      setBursaryLinks(b.data);
      setEvents(e.data);
      setLeaders(l.data);
    } finally { setLoading(false); }
  };

  const handleRsvp = async (id: number) => {
    try {
      await eventsAPI.rsvp(id);
      setRsvpd(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
    } catch {}
  };

  const parseOpportunity = (content: string) => ({
    link:     (content.match(/APPLY_LINK:(.+?)(\n|$)/)?.[1] || '').trim(),
    deadline: (content.match(/DEADLINE:(.+?)(\n|$)/)?.[1] || '').trim(),
    type:     (content.match(/TYPE:(.+?)(\n|$)/)?.[1] || 'job').trim(),
    content:  content.replace(/APPLY_LINK:.+?(\n|$)/, '').replace(/DEADLINE:.+?(\n|$)/, '').replace(/TYPE:.+?(\n|$)/, '').trim(),
  });

  const parseBursaryLink = (content: string) => ({
    link:     (content.match(/BURSARY_LINK:(.+?)(\n|$)/)?.[1] || '').trim(),
    notes:    (content.match(/NOTES:(.+?)(\n|$)/)?.[1] || '').trim(),
    deadline: (content.match(/DEADLINE:(.+?)(\n|$)/)?.[1] || '').trim(),
  });

  const TYPE_COLORS: Record<string, string> = {
    announcement:   'bg-blue-100 text-blue-700',
    mentorship:     'bg-purple-100 text-purple-700',
    county_program: 'bg-teal-100 text-teal-700',
    event_info:     'bg-pink-100 text-pink-700',
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-10 pb-4" style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a1b 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white border-opacity-30">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-white bg-opacity-20 text-white font-bold text-lg">{user?.full_name?.[0]}</div>
              }
            </div>
            <div>
              <p className="text-green-200 text-xs">Welcome back,</p>
              <h1 className="text-white font-bold text-lg leading-tight">{user?.full_name?.split(' ')[0]} 👋</h1>
            </div>
          </div>
          <button onClick={loadAll} className="w-9 h-9 bg-white bg-opacity-10 rounded-full flex items-center justify-center text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl px-3 py-2 border border-white border-opacity-10">
          <p className="text-green-100 text-xs">🌍 Mwala Constituency · {user?.ward}</p>
          <p className="text-white text-sm font-semibold mt-0.5">Unity · Progress · Youth Empowerment</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* HOME */}
        {page === 'home' && (
          loading ? (
            <div className="text-center py-16"><RefreshCw className="w-7 h-7 animate-spin text-green-600 mx-auto" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No updates yet</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-gray-100">
              {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-44 object-cover" />}
              <div className="p-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[post.post_type] || 'bg-gray-100 text-gray-600'}`}>
                  {post.post_type.replace('_', ' ')}
                </span>
                <h3 className="font-bold text-gray-800 mt-2 mb-1">{post.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  <span>{post.author_role === 'mp' ? '🏛️ MP' : '👥 Leader'} · {post.author_name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* JOBS */}
        {page === 'jobs' && (
          opportunities.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No opportunities yet</p>
            </div>
          ) : opportunities.map(opp => {
            const parsed = parseOpportunity(opp.content);
            const typeColors: Record<string,string> = {
              job: 'bg-blue-100 text-blue-700',
              internship: 'bg-purple-100 text-purple-700',
              attachment: 'bg-orange-100 text-orange-700',
            };
            return (
              <div key={opp.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
                {opp.image_url && <img src={opp.image_url} alt={opp.title} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${typeColors[parsed.type] || 'bg-gray-100 text-gray-600'}`}>
                    {parsed.type === 'job' ? '💼' : parsed.type === 'internship' ? '🎓' : '📎'} {parsed.type}
                  </span>
                  <h3 className="font-bold text-gray-800 text-base mt-2 mb-1">{opp.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-2">{parsed.content}</p>
                  {parsed.deadline && <p className="text-xs text-orange-600 font-semibold mb-3">⏰ Deadline: {parsed.deadline}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{opp.author_role === 'mp' ? '🏛️ MP' : '👥 Leader'} · {opp.author_name}</span>
                    {parsed.link && (
                      <a href={parsed.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl"
                        style={{ background: '#1a3a6a' }}>
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* BURSARY */}
        {page === 'bursary' && (
          bursaryLinks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bursary links yet</p>
              <p className="text-gray-400 text-xs mt-1">The MP will share bursary portals here</p>
            </div>
          ) : bursaryLinks.map(b => {
            const p = parseBursaryLink(b.content);
            return (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #166534, #c9a84c)' }} />
                <div className="p-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">🎓 Bursary Portal</span>
                  <h3 className="font-bold text-gray-800 text-base mt-2 mb-1">{b.title}</h3>
                  {p.notes && <p className="text-gray-500 text-sm mb-2">{p.notes}</p>}
                  {p.deadline && <p className="text-xs text-orange-600 font-semibold mb-2">⏰ Deadline: {p.deadline}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">🏛️ MP · {b.author_name}</span>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-xl shadow-md"
                        style={{ background: 'linear-gradient(135deg, #166534, #22c55e)' }}>
                        Open Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* EVENTS */}
        {page === 'events' && (
          events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No upcoming events</p>
            </div>
          ) : events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
              {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" />}
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-base mb-2">{event.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{event.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-green-600" />
                  <span>{new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  <span>{event.location}</span>
                </div>
                <button onClick={() => handleRsvp(event.id)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition ${rsvpd.includes(event.id) ? 'bg-gray-100 text-gray-600' : 'text-white shadow-md'}`}
                  style={!rsvpd.includes(event.id) ? { background: 'linear-gradient(135deg, #1a3a1a, #2d5a1b)' } : {}}>
                  {rsvpd.includes(event.id) ? '✓ RSVP Confirmed' : 'RSVP for this Event'}
                </button>
              </div>
            </div>
          ))
        )}

        {/* LEADERS */}
        {page === 'leaders' && (
          leaders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 font-medium">No leaders approved yet</p>
            </div>
          ) : leaders.map((leader: any) => (
            <div key={leader.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl text-white shrink-0"
                  style={{ background: '#2d1b69' }}>
                  {leader.profile_photo
                    ? <img src={leader.profile_photo} alt={leader.full_name} className="w-full h-full object-cover" />
                    : leader.full_name?.[0]
                  }
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{leader.full_name}</h3>
                  <p className="text-purple-600 text-sm font-semibold">{leader.position || 'Chapter Leader'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-gray-400 text-xs">{leader.ward}</p>
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

export default MemberDashboard;