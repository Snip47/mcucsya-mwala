import React, { useEffect, useState } from 'react';
import { eventsAPI, Event } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Plus, RefreshCw } from 'lucide-react';

const EventsPage: React.FC = () => {
  const { isLeaderOrAbove }             = useAuth();
  const [events,      setEvents]        = useState<Event[]>([]);
  const [loading,     setLoading]       = useState(true);
  const [showCreate,  setShowCreate]    = useState(false);
  const [submitting,  setSubmitting]    = useState(false);
  const [error,       setError]         = useState('');
  const [rsvpd,       setRsvpd]         = useState<number[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', location: '', event_date: ''
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.location || !form.event_date) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      await eventsAPI.create(data);
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', event_date: '' });
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (id: number) => {
    try {
      await eventsAPI.rsvp(id);
      setRsvpd(prev =>
        prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-green-700 px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-7 h-7 text-white" />
          <div>
            <h1 className="text-white font-bold text-lg">Events</h1>
            <p className="text-green-200 text-xs">Mwala chapter events and activities</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLeaderOrAbove && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? 'Cancel' : 'Create Event'}
          </button>
        )}

        {showCreate && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-green-100">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">{error}</div>}
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Event title" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Event description" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />
              <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="Location" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input value={form.event_date} onChange={e => setForm(p => ({...p, event_date: e.target.value}))} type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <button onClick={handleCreate} disabled={submitting} className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming events</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-gray-100">
              {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" />}
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.location}</span>
                </div>
                <button
                  onClick={() => handleRSVP(event.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                    rsvpd.includes(event.id)
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-700 text-white'
                  }`}
                >
                  {rsvpd.includes(event.id) ? '✓ RSVP Confirmed' : 'RSVP for this event'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventsPage;