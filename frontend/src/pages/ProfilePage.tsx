import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { User, MapPin, Phone, Building, LogOut, Shield, Camera, Crown, Users } from 'lucide-react';

const ROLE_INFO: Record<string, { label: string; color: string; icon: any }> = {
  member:  { label: 'Member',               color: '#1a3a6a', icon: User   },
  leader:  { label: 'Chapter Leader',       color: '#2d1b69', icon: Users  },
  mp:      { label: 'Member of Parliament', color: '#8b0000', icon: Crown  },
  admin:   { label: 'Administrator',        color: '#1a1a1a', icon: Shield },
};

const ProfilePage: React.FC<{ setPage: (p: string) => void }> = ({ setPage }) => {
  const { user, logout, updatePhoto, isAdmin, token } = useAuth();
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const info     = ROLE_INFO[user.role] || ROLE_INFO.member;
  const RoleIcon = info.icon;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    setUploadMsg('');

    try {
      const res = await authAPI.updatePhoto(file, token!);
      const newUrl = res.data.photo_url;
      updatePhoto(newUrl);
      setPreviewUrl(newUrl);
      setUploadMsg('Photo updated successfully!');
      setTimeout(() => setUploadMsg(''), 3000);
    } catch (err) {
      setUploadMsg('Failed to upload. Please try again.');
      setPreviewUrl(null);
      setTimeout(() => setUploadMsg(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const currentPhoto = previewUrl || user.profile_photo;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-10 pb-16" style={{ background: info.color }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            <img src="/logo.png" alt="MCUCSYA" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">My Profile</h1>
            <p className="text-white opacity-70 text-xs">MCUCSYA Mwala Chapter</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-4">

          {uploadMsg && (
            <div className={`text-sm rounded-xl px-4 py-2.5 mb-4 text-center font-medium ${
              uploadMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {uploadMsg}
            </div>
          )}

          <div className="flex items-start gap-4 mb-4">
            {/* Profile photo with upload */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4"
                style={{ borderColor: info.color + '50' }}>
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: info.color }}>
                    {user.full_name[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white"
                style={{ background: info.color }}
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <h2 className="font-bold text-gray-800 text-lg leading-tight">{user.full_name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <RoleIcon className="w-3.5 h-3.5" style={{ color: info.color }} />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ background: info.color }}>
                  {info.label}
                </span>
              </div>
              {user.position && (
                <p className="text-xs text-gray-500 mt-1">{user.position}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Tap camera icon to change photo
              </p>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-gray-50 pt-4">
            {user.ward && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: info.color }} />
                <span>{user.ward}, Mwala Constituency</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 shrink-0" style={{ color: info.color }} />
              <span>{user.phone}</span>
            </div>
            {user.institution && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building className="w-4 h-4 shrink-0" style={{ color: info.color }} />
                <span>{user.institution}{user.year_of_study ? ` · ${user.year_of_study}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* About MCUCSYA */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src="/logo.png" alt="MCUCSYA" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">MCUCSYA Mwala Chapter</h3>
              <p className="text-xs text-gray-400">Togetherness for Prosperity</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 rounded-xl p-3">
            {[
              '🎓 Education & Bursary Support',
              '💼 Youth Opportunities & Internships',
              '🌍 Climate Change Action',
              '🧠 Mental Health & Wellbeing',
              '✌️ Peace-building',
              '⚖️ Leadership & Governance',
              '⚧️ Gender Equality & Reproductive Health',
            ].map((item, i) => (
              <p key={i}>{item}</p>
            ))}
          </div>
        </div>

        {isAdmin && (
          <button onClick={() => setPage('admin')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold mb-3 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Panel
          </button>
        )}

        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-semibold border border-red-100">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;