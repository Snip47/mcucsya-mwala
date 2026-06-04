import React, { useEffect, useState, useRef } from 'react';
import { postsAPI, opportunitiesAPI, bursaryAPI, eventsAPI, chatAPI, Post, Event, ChatMessage } from '../api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Send, Crown, Users, RefreshCw, Bell, Briefcase,
  BookOpen, ExternalLink, Calendar, MapPin, ChevronRight,
  MessageCircle
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

const MemberDashboard: React.FC<{ page: string }> = ({ page }) => {
  const { user, token }                       = useAuth();
  const [posts,         setPosts]             = useState<Post[]>([]);
  const [opportunities, setOpportunities]     = useState<Post[]>([]);
  const [bursaryLinks,  setBursaryLinks]      = useState<any[]>([]);
  const [events,        setEvents]            = useState<Event[]>([]);
  const [leaders,       setLeaders]           = useState<any[]>([]);
  const [chatTarget,    setChatTarget]        = useState<'leader' | 'mp' | null>(null);
  const [messages,      setMessages]          = useState<ChatMessage[]>([]);
  const [loading,       setLoading]           = useState(true);
  const [newMsg,        setNewMsg]            = useState('');
  const [sending,       setSending]           = useState(false);
  const [rsvpd,         setRsvpd]             = useState<number[]>([]);
  const bottomRef                             = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (chatTarget) loadMessages(); }, [chatTarget]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

  const loadMessages = async () => {
    if (!chatTarget) return;
    const res = await chatAPI.getMessages(chatTarget);
    setMessages(res.data);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !chatTarget || sending) return;
    setSending(true);
    try {
      await chatAPI.sendMessage(chatTarget, newMsg.trim());
      setNewMsg('');
      loadMessages();
    } finally { setSending(false); }
  };

  const handleRsvp = async (id: number) => {
    try {
      await eventsAPI.rsvp(id);
      setRsvpd(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
    } catch {}
  };

  const parseOpportunity = (content: string) => {
    const linkMatch     = content.match(/APPLY_LINK:(.+?)(\n|$)/);
    const deadlineMatch = content.match(/DEADLINE:(.+?)(\n|$)/);
    const typeMatch     = content.match(/TYPE:(.+?)(\n|$)/);
    return {
      link:     linkMatch?.[1]?.trim() || '',
      deadline: deadlineMatch?.[1]?.trim() || '',
      type:     typeMatch?.[1]?.trim() || 'job',
      content:  content.replace(/APPLY_LINK:.+?(\n|$)/, '').replace(/DEADLINE:.+?(\n|$)/, '').replace(/TYPE:.+?(\n|$)/, '').trim(),
    };
  };

  const parseBursaryLink = (content: string) => ({
    link:     (content.match(/BURSARY_LINK:(.+?)(\n|$)/)?.[1] || '').trim(),
    notes:    (content.match(/NOTES:(.+?)(\n|$)/)?.[1] || '').trim(),
    deadline: (content.match(/DEADLINE:(.+?)(\n|$)/)?.[1] || '').trim(),
  });

  const TYPE_COLORS: Record<string, string> = {
    announcement: 'bg-blue-100 text-blue-700',
    mentorship:   'bg-purple-100 text-purple-700',
    county_program: 'bg-teal-100 text-teal-700',
    event_info:   'bg-pink-100 text-pink-700',
  };

  if (chatTarget) {
    return (
      <div className="flex flex-col h-screen pb-20">
        <div className="px-4 pt-10 pb-4 flex items-center gap-3"
          style={{ background: chatTarget === 'mp' ? '#8b0000' : '#2d1b69' }}>
          <button onClick={() => setChatTarget(null)} className="text-white text-2xl">←</button>
          <div className="w-9 h-9 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            {chatTarget === 'mp' ? <Crown className="w-5 h-5 text-white" /> : <Users className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{chatTarget === 'mp' ? 'Ask the MP' : 'Ask Chapter Leaders'}</p>
            <p className="text-white opacity-60 text-xs">{chatTarget === 'mp' ? 'Bursary & county programs' : 'Events & announcements'}</p>
          </div>
          <button onClick={loadMessages} className="text-white opacity-60">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No messages yet. Ask your first question!</p>
            </div>
          ) : messages.map(msg => {
            const isMe = msg.sender_name === user?.full_name;
            const isOfficial = ['mp', 'leader', 'admin'].includes(msg.sender_role);
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe ? 'text-white rounded-tr-sm' : isOfficial ? 'text-white rounded-tl-sm' : 'bg-white rounded-tl-sm'}`}
                  style={isMe ? { background: '#1a3a6a' } : isOfficial ? { background: chatTarget === 'mp' ? '#8b0000' : '#2d1b69' } : {}}>
                  {!isMe && <p className="text-xs font-bold opacity-80 mb-0.5">{isOfficial ? `${msg.sender_role.toUpperCase()} · ` : ''}{msg.sender_name}</p>}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe || isOfficial ? 'opacity-60' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${chatTarget === 'mp' ? 'MP' : 'Leaders'}...`}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
            <button onClick={handleSend} disabled={!newMsg.trim() || sending}
              className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-40"
              style={{ background: chatTarget === 'mp' ? '#8b0000' : '#2d1b69' }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Page content */}
      <div className="px-4 pt-4">
        {page === 'home' && (
          <>
            {loading ? (
              <div className="text-center py-16"><RefreshCw className="w-7 h-7 animate-spin text-green-600 mx-auto" /></div>
            ) : (
              <>
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button onClick={() => setChatTarget('leader')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #2d1b69, #4a2d9e)' }}>
                    <Users className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs">Chat Leaders</p>
                      <p className="text-white opacity-60 text-xs">Ask questions</p>
                    </div>
                  </button>
                  <button onClick={() => setChatTarget('mp')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #8b0000, #cc2200)' }}>
                    <Crown className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs">Chat MP</p>
                      <p className="text-white opacity-60 text-xs">Bursary & county</p>
                    </div>
                  </button>
                </div>

                {/* Feed */}
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Latest Updates</p>
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No updates yet</p>
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
                ))}
              </>
            )}
          </>
        )}

        {page === 'jobs' && (
          <>
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Available Opportunities</p>
            {opportunities.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No opportunities yet</p>
                <p className="text-gray-400 text-xs mt-1">Jobs, internships and attachments will appear here</p>
              </div>
            ) : opportunities.map(opp => {
              const parsed = parseOpportunity(opp.content);
              const typeColors: Record<string, string> = {
                job: 'bg-blue-100 text-blue-700',
                internship: 'bg-purple-100 text-purple-700',
                attachment: 'bg-orange-100 text-orange-700',
              };
              const typeIcons: Record<string, string> = { job: '💼', internship: '🎓', attachment: '📎' };
              return (
                <div key={opp.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
                  {opp.image_url && <img src={opp.image_url} alt={opp.title} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeColors[parsed.type] || 'bg-gray-100 text-gray-600'}`}>
                        {typeIcons[parsed.type]} {parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-1.5">{opp.title}</h3>
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
            })}
          </>
        )}

        {page === 'bursary' && (
          <>
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Bursary Portals from MP</p>
            {bursaryLinks.length === 0 ? (
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
            })}
          </>
        )}

        {page === 'events' && (
          <>
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Upcoming Events</p>
            {events.length === 0 ? (
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
            ))}
          </>
        )}

        {page === 'leaders' && (
          <>
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Mwala Chapter Leaders</p>
            {leaders.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No leaders approved yet</p>
              </div>
            ) : leaders.map((leader: any) => (
              <div key={leader.id} className="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-3 flex items-center justify-center font-bold text-xl text-white shrink-0"
                    style={{ background: '#2d1b69', borderColor: '#2d1b6940', borderWidth: 3 }}>
                    {leader.profile_photo
                      ? <img src={leader.profile_photo} alt={leader.full_name} className="w-full h-full object-cover" />
                      : leader.full_name?.[0]
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{leader.full_name}</h3>
                    <p className="text-purple-600 text-sm font-semibold">{leader.position || 'Chapter Leader'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p className="text-gray-400 text-xs">{leader.ward}</p>
                    </div>
                  </div>
                  <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;