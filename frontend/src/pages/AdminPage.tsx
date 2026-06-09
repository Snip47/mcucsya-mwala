import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, CheckCircle, XCircle, Trash2,
  Plus, Shield, Users, Crown, User, RefreshCw
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  member:  '#1a3a6a',
  leader:  '#2d1b69',
  mp:      '#8b0000',
  admin:   '#1a1a1a',
};

const AdminPage: React.FC<{ setPage: (p: string) => void }> = ({ setPage }) => {
  const { user }                          = useAuth();
  const [tab,       setTab]               = useState<'pending' | 'members' | 'admins' | 'bursary' | 'add'>('pending');
  const [pending,   setPending]           = useState<any[]>([]);
  const [members,   setMembers]           = useState<any[]>([]);
  const [admins,    setAdmins]            = useState<any[]>([]);
  const [bursary,   setBursary]           = useState<any[]>([]);
  const [stats,     setStats]             = useState<any>(null);
  const [loading,   setLoading]           = useState(true);
  const [msg,       setMsg]               = useState('');
  const [error,     setError]             = useState('');

  const [addForm, setAddForm] = useState({
    full_name: '', national_id: '', phone: '', role: 'member',
    ward: 'Mwala Ward', position: '', password: 'mcucsya2025'
  });

  const [adminForm, setAdminForm] = useState({
    full_name: '', national_id: '', phone: '', password: ''
  });

  if (user?.role !== 'admin') return <div className="p-6 text-center">Access denied</div>;

 useEffect(() => {
  loadAll();
  const interval = setInterval(loadAll, 1000);
  return () => clearInterval(interval);
}, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, m, a, b, s] = await Promise.all([
        adminAPI.getPending(),
        adminAPI.getAllMembers(),
        adminAPI.getAdmins(),
        adminAPI.getBursaryApps(),
        adminAPI.getStats(),
      ]);
      setPending(p.data);
      setMembers(m.data);
      setAdmins(a.data);
      setBursary(b.data);
      setStats(s.data);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const showErr = (e: string) => { setError(e); setTimeout(() => setError(''), 4000); };

  const handleApprove = async (id: number) => {
    try { await adminAPI.approve(id); loadAll(); showMsg('User approved!'); }
    catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handleReject = async (id: number) => {
    try { await adminAPI.reject(id); loadAll(); showMsg('User rejected.'); }
    catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try { await adminAPI.deleteUser(id); loadAll(); showMsg(`${name} deleted.`); }
    catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handleAddMember = async () => {
    if (!addForm.full_name || !addForm.national_id || !addForm.phone) {
      showErr('Fill all required fields'); return;
    }
    try {
      const form = new FormData();
      Object.entries(addForm).forEach(([k, v]) => { if (v) form.append(k, v); });
      const res = await adminAPI.addMember(form);
      showMsg(res.data.message);
      setAddForm({ full_name: '', national_id: '', phone: '', role: 'member', ward: 'Mwala Ward', position: '', password: 'mcucsya2025' });
      loadAll();
    } catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.full_name || !adminForm.national_id || !adminForm.phone || !adminForm.password) {
      showErr('Fill all required fields'); return;
    }
    try {
      const form = new FormData();
      Object.entries(adminForm).forEach(([k, v]) => form.append(k, v));
      const res = await adminAPI.addAdmin(form);
      showMsg(res.data.message);
      setAdminForm({ full_name: '', national_id: '', phone: '', password: '' });
      loadAll();
    } catch (e: any) { showErr(e.response?.data?.detail || 'Failed'); }
  };

  const WARDS = ['Kibauni', 'Wamunyu', 'Mwala/Makutano', 'Muthetheni', 'Mbiuni', 'Masii'];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setPage('profile')} className="text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white">
              <img src="/logo.png" alt="MCUCSYA" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-xs">MCUCSYA Mwala Chapter</p>
            </div>
          </div>
          <button onClick={loadAll} className="ml-auto text-gray-400">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-1">
            {[
              { label: 'Members',  value: stats.total_members,     color: '#1a3a6a' },
              { label: 'Leaders',  value: stats.total_leaders,     color: '#2d1b69' },
              { label: 'MP',       value: stats.total_mp,          color: '#8b0000' },
              { label: 'Admins',   value: stats.total_admins,      color: '#444' },
              { label: 'Pending',  value: stats.pending_approvals, color: '#c9a84c' },
              { label: 'Bursary',  value: stats.pending_bursary,   color: '#166534' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-2 text-center" style={{ background: s.color + '33' }}>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-300">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg   && <div className="mx-4 mt-3 bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2">{msg}</div>}
      {error && <div className="mx-4 mt-3 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 px-4 py-3">
        {[
          { id: 'pending', label: `Pending (${pending.length})` },
          { id: 'members', label: 'Members' },
          { id: 'admins',  label: 'Admins' },
          { id: 'bursary', label: 'Bursary' },
          { id: 'add',     label: '+ Add' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* Pending */}
        {tab === 'pending' && (
          pending.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No pending approvals</p>
            </div>
          ) : pending.map((m: any) => (
            <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
                  style={{ background: ROLE_COLORS[m.role] }}>
                  {m.profile_photo
                    ? <img src={m.profile_photo} alt={m.full_name} className="w-full h-full object-cover" />
                    : m.full_name[0]
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{m.full_name}</h3>
                  <span className="text-xs text-white px-2 py-0.5 rounded-full"
                    style={{ background: ROLE_COLORS[m.role] }}>
                    {m.role === 'mp' ? 'MP' : 'Chapter Leader'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1 mb-3">
                <p>🪪 ID: {m.national_id}</p>
                <p>📞 {m.phone}</p>
                {m.ward     && <p>📍 {m.ward}</p>}
                {m.position && <p>💼 {m.position}</p>}
                <p>📅 Applied: {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(m.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2.5 rounded-xl text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => handleReject(m.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-orange-100 text-orange-600 py-2.5 rounded-xl text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => handleDelete(m.id, m.full_name)}
                  className="w-10 flex items-center justify-center bg-red-100 text-red-500 py-2.5 rounded-xl">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* All members */}
        {tab === 'members' && (
          <>
            <p className="text-xs text-gray-400 mb-3">{members.length} total users (excluding admins)</p>
            {members.map((m: any) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
                      style={{ background: ROLE_COLORS[m.role] || '#666' }}>
                      {m.profile_photo
                        ? <img src={m.profile_photo} alt={m.full_name} className="w-full h-full object-cover" />
                        : m.full_name[0]
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{m.full_name}</p>
                      <p className="text-gray-400 text-xs">{m.ward || 'No ward'} · {m.phone}</p>
                      {m.position && <p className="text-gray-400 text-xs">{m.position}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <span className="text-xs text-white px-2 py-0.5 rounded-full"
                        style={{ background: ROLE_COLORS[m.role] || '#666' }}>
                        {m.role}
                      </span>
                      <p className={`text-xs mt-0.5 ${
                        m.status === 'approved' ? 'text-green-500' :
                        m.status === 'pending'  ? 'text-yellow-500' : 'text-red-500'
                      }`}>{m.status}</p>
                    </div>
                    <button onClick={() => handleDelete(m.id, m.full_name)}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 rounded-xl">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Admins */}
        {tab === 'admins' && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-xs text-yellow-800">
              ⚠️ Only add trusted people as admins. Admins have full system access.
            </div>
            {admins.map((a: any) => (
              <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-900 text-white font-bold">
                      {a.profile_photo
                        ? <img src={a.profile_photo} alt={a.full_name} className="w-full h-full object-cover" />
                        : <Shield className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{a.full_name}</p>
                      <p className="text-gray-400 text-xs">{a.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Admin</span>
                    {a.national_id !== user?.national_id && (
                      <button onClick={() => handleDelete(a.id, a.full_name)}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-400 rounded-xl">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add admin form */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Add New Admin
              </h3>
              <div className="space-y-3">
                <input value={adminForm.full_name} onChange={e => setAdminForm(p => ({...p, full_name: e.target.value}))}
                  placeholder="Full name *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input value={adminForm.national_id} onChange={e => setAdminForm(p => ({...p, national_id: e.target.value}))}
                  placeholder="National ID *" type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input value={adminForm.phone} onChange={e => setAdminForm(p => ({...p, phone: e.target.value}))}
                  placeholder="Phone number *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input value={adminForm.password} onChange={e => setAdminForm(p => ({...p, password: e.target.value}))}
                  placeholder="Password *" type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                <button onClick={handleAddAdmin}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold">
                  Add Admin
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bursary */}
        {tab === 'bursary' && (
          bursary.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No bursary applications yet</p>
            </div>
          ) : bursary.map((app: any) => (
            <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{app.applicant_name}</h3>
                  <p className="text-gray-400 text-xs">{app.institution} · {app.course}</p>
                  <p className="text-green-600 text-sm font-semibold mt-1">KES {app.amount_requested?.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{app.reason}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  app.status === 'approved' ? 'bg-green-100 text-green-700' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{app.status}</span>
              </div>
              {app.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={async () => { await adminAPI.updateBursary(app.id, 'approved', ''); loadAll(); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold">
                    Approve
                  </button>
                  <button onClick={async () => { await adminAPI.updateBursary(app.id, 'rejected', ''); loadAll(); }}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-xs font-semibold">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Add member/leader/mp */}
        {tab === 'add' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add User Manually
            </h3>
            <p className="text-xs text-gray-500 mb-4">Add a member, leader, or MP directly. Default password is mcucsya2025.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Role *</label>
                <select value={addForm.role} onChange={e => setAddForm(p => ({...p, role: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  <option value="member">Member</option>
                  <option value="leader">Chapter Leader</option>
                  <option value="mp">MP</option>
                </select>
              </div>
              <input value={addForm.full_name} onChange={e => setAddForm(p => ({...p, full_name: e.target.value}))}
                placeholder="Full name *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input value={addForm.national_id} onChange={e => setAddForm(p => ({...p, national_id: e.target.value}))}
                placeholder="National ID *" type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <input value={addForm.phone} onChange={e => setAddForm(p => ({...p, phone: e.target.value}))}
                placeholder="Phone number *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              {addForm.role !== 'mp' && (
                <select value={addForm.ward} onChange={e => setAddForm(p => ({...p, ward: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              )}
              {addForm.role === 'leader' && (
                <input value={addForm.position} onChange={e => setAddForm(p => ({...p, position: e.target.value}))}
                  placeholder="Position e.g. Chairperson" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              )}
              <input value={addForm.password} onChange={e => setAddForm(p => ({...p, password: e.target.value}))}
                placeholder="Password (default: mcucsya2025)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
              <button onClick={handleAddMember}
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold">
                Add User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;