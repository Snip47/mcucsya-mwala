import React, { useState } from 'react';
import { authAPI } from '../api';
import { ChevronLeft, Camera } from 'lucide-react';

const WARDS = [
  'Kibauni',
  'Wamunyu',
  'Mwala/Makutano',
  'Muthetheni',
  'Mbiuni',
  'Masii'
];

const STUDY_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Graduate'];

const RegisterPage: React.FC<{ role: string; onBack: () => void }> = ({ role, onBack }) => {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [photo,    setPhoto]    = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [hasInstitution, setHasInstitution] = useState(false);

  const [form, setForm] = useState({
    full_name: '', national_id: '', phone: '', ward: '',
    position: '', institution: '', course: '', year_of_study: '',
    password: '', confirm_password: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); }
  };

  const handleRegister = async () => {
    if (!form.full_name || !form.national_id || !form.phone || !form.password) {
      setError('Please fill in all required fields'); return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if ((role === 'member' || role === 'leader') && !form.ward) {
      setError('Please select your ward'); return;
    }
    if (role === 'leader' && !form.position) {
      setError('Please enter your position'); return;
    }

    setLoading(true); setError('');
    try {
      const data = new FormData();
      data.append('full_name',   form.full_name);
      data.append('national_id', form.national_id);
      data.append('phone',       form.phone);
      data.append('password',    form.password);
      if (photo) data.append('profile_photo', photo);

      let res;
      if (role === 'member') {
        data.append('ward', form.ward);
        if (form.institution)            data.append('institution',   form.institution);
        if (form.institution && form.course) data.append('course', form.course);
        if (form.institution && form.year_of_study) data.append('year_of_study', form.year_of_study);
        res = await authAPI.registerMember(data);
      } else if (role === 'leader') {
        data.append('ward',     form.ward);
        data.append('position', form.position);
        res = await authAPI.registerLeader(data);
      } else {
        res = await authAPI.registerMP(data);
      }
      setSuccess(res?.data?.message || 'Registration successful!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const roleColor = role === 'leader' ? '#2d1b69' : role === 'mp' ? '#8b0000' : '#1a3a6a';
 const roleLabel = role === 'leader' ? 'Chapter Leader' : role === 'mp' ? 'MP' : 'Comrade / Youth';

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
        <img src="/logo.png" alt="MCUCSYA" className="w-20 h-20 object-contain mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
          {role === 'member' ? '🎉 Welcome!' : '✅ Submitted!'}
        </h2>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 w-full max-w-sm text-center">
          <p className="text-gray-600 text-sm leading-relaxed">{success}</p>
          {role !== 'member' && (
            <p className="text-gray-400 text-xs mt-2">Admin will review within 24-48 hours.</p>
          )}
        </div>
        <button onClick={onBack} className="text-white px-8 py-3.5 rounded-xl font-bold shadow-md"
          style={{ background: roleColor }}>
          {role === 'member' ? 'Login Now' : 'Back to Login'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-4 flex items-center gap-3" style={{ background: roleColor }}>
        <button onClick={onBack} className="text-white"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white">
            <img src="/logo.png" alt="MCUCSYA" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Register as {roleLabel}</h1>
            <p className="text-white opacity-60 text-xs">
              {role === 'member' ? '✅ Instant access' : '⏳ Admin approval required'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 pb-10">
        {/* Photo upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 mb-2"
            style={{ borderColor: roleColor + '50' }}>
            {photoUrl
              ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gray-100 text-gray-400">
                  {form.full_name?.[0]?.toUpperCase() || '?'}
                </div>
            }
          </div>
          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full"
            style={{ color: roleColor, background: roleColor + '15' }}>
            <Camera className="w-3.5 h-3.5" />
            Add Photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label>
            <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
              placeholder="As in your ID / Birth Certificate"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">ID / Maisha Card / Birth Certificate No. *</label>
            <input value={form.national_id} onChange={e => update('national_id', e.target.value)}
              placeholder="Enter your ID number (6-9 digits)" type="number"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
            <p className="text-xs text-gray-400 mt-1">National ID, Maisha Card (9 digits) or Birth Certificate accepted</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number *</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="e.g. 0712345678" type="tel"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
          </div>

          {(role === 'member' || role === 'leader') && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ward *</label>
              <select value={form.ward} onChange={e => update('ward', e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none bg-white">
                <option value="">Select your ward</option>
                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}

          {role === 'leader' && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Your Position in Chapter *</label>
              <input value={form.position} onChange={e => update('position', e.target.value)}
                placeholder="e.g. Chairperson, Secretary, Treasurer, Vice Chair"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
            </div>
          )}

          {role === 'member' && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Are you a student?</p>
                  <button
                    onClick={() => setHasInstitution(!hasInstitution)}
                    className={`w-12 h-6 rounded-full transition-colors ${hasInstitution ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${hasInstitution ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-400">Toggle if you are currently studying</p>
              </div>

              {hasInstitution && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Institution</label>
                    <input value={form.institution} onChange={e => update('institution', e.target.value)}
                      placeholder="e.g. Machakos University, Mwala Technical"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Course / Program</label>
                    <input value={form.course} onChange={e => update('course', e.target.value)}
                      placeholder="e.g. Computer Science, Business Management"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Year of Study</label>
                    <select value={form.year_of_study} onChange={e => update('year_of_study', e.target.value)}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none bg-white">
                      <option value="">Select year</option>
                      {STUDY_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password *</label>
            <input value={form.password} onChange={e => update('password', e.target.value)}
              placeholder="At least 6 characters" type="password"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm Password *</label>
            <input value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)}
              placeholder="Repeat your password" type="password"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
          </div>
        </div>

        <button onClick={handleRegister} disabled={loading}
          className="w-full text-white py-4 rounded-xl font-bold text-sm mt-6 disabled:opacity-60 shadow-lg"
          style={{ background: roleColor }}>
          {loading ? 'Registering...' : `Register as ${roleLabel}`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <button onClick={onBack} className="font-bold" style={{ color: roleColor }}>Sign in</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;