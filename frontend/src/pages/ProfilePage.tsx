import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import {
  User, MapPin, Phone, Building,
  LogOut, Shield, Camera, Crown, Users
} from 'lucide-react';

const ROLE_INFO: Record<string, { label: string; color: string; icon: any }> = {
  member:  { label: 'Comrade / Youth',       color: '#1a3a6a', icon: User   },
  leader:  { label: 'Chapter Leader',        color: '#2d1b69', icon: Users  },
  mp:      { label: 'Member of Parliament',  color: '#8b0000', icon: Crown  },
  admin:   { label: 'Administrator',         color: '#1a1a1a', icon: Shield },
};

const ProfilePage: React.FC<{ setPage: (p: string) => void }> = ({ setPage }) => {
  const { user, logout, updatePhoto, refreshUser, isAdmin, token } = useAuth();
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState('');
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const info     = ROLE_INFO[user.role] || ROLE_INFO.member;
  const RoleIcon = info.icon;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setLocalPhoto(localUrl);
    setUploading(true);
    setUploadMsg('Uploading photo...');

    try {
      const res    = await authAPI.updatePhoto(file, token!);
      const newUrl = res.data.photo_url;

      // Update context and localStorage with real Cloudinary URL
      updatePhoto(newUrl);
      setLocalPhoto(newUrl);
      setUploadMsg('✓ Photo updated!');
      
      // Also refresh user from server to confirm
      await refreshUser();
      setTimeout(() => setUploadMsg(''), 3000);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setLocalPhoto(null);
      setUploadMsg('✗ Upload failed. Please try again.');
      setTimeout(() => setUploadMsg(''), 4000);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Use localPhoto first (instant preview), then user.profile_photo from context
  const displayPhoto = localPhoto || user.profile_photo;

  return (
    <div className="pb-24">
      {/* Header banner */}
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
        {/* Main profile card */}
        <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 mb-4">

          {/* Upload status message */}
          {uploadMsg !== '' && (
            <div className={`text-sm rounded-xl px-4 py-2.5 mb-4 text-center font-medium ${
              uploadMsg.includes('✓')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : uploadMsg.includes('✗')
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {uploadMsg}
            </div>
          )}

          <div className="flex items-start gap-4 mb-5">
            {/* Profile photo area */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full overflow-hidden"
                style={{ border: `4px solid ${info.color}40` }}
              >
                {displayPhoto ? (
                  <img
                    key={displayPhoto}
                    src={displayPhoto}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      img.parentElement!.innerHTML = `
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${info.color};color:white;font-size:28px;font-weight:bold">
                          ${user.full_name[0].toUpperCase()}
                        </div>`;
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ background: info.color }}
                  >
                    {user.full_name[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white"
                style={{ background: uploading ? '#999' : info.color }}
              >
                {uploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

            {/* Name and role */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-800 text-lg leading-tight">{user.full_name}</h2>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ background: info.color }}
                >
                  {info.label}
                </span>
              </div>
              {user.position && (
                <p className="text-xs text-gray-500 mt-1.5 font-medium">{user.position}</p>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-2 text-xs font-semibold flex items-center gap-1 underline underline-offset-2"
                style={{ color: info.color }}
              >
                <Camera className="w-3 h-3" />
                {uploading ? 'Uploading...' : displayPhoto ? 'Change photo' : 'Add photo'}
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: info.color + '15' }}>
                <User className="w-4 h-4" style={{ color: info.color }} />
              </div>
              <span className="font-medium">ID: {user.national_id}</span>
            </div>

            {user.ward && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: info.color + '15' }}>
                  <MapPin className="w-4 h-4" style={{ color: info.color }} />
                </div>
                <span>{user.ward}, Mwala Constituency</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: info.color + '15' }}>
                <Phone className="w-4 h-4" style={{ color: info.color }} />
              </div>
              <span>{user.phone}</span>
            </div>

            {user.institution && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: info.color + '15' }}>
                  <Building className="w-4 h-4" style={{ color: info.color }} />
                </div>
                <span>
                  {user.institution}
                  {user.course      ? ` · ${user.course}`      : ''}
                  {user.year_of_study ? ` · ${user.year_of_study}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* About MCUCSYA */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
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
              '✌️ Peace-building & Civic Education',
              '⚖️ Leadership & Governance',
              '⚧️ Gender Equality & Reproductive Health',
            ].map((item, i) => (
              <p key={i}>{item}</p>
            ))}
          </div>
        </div>

        {/* Admin panel button */}
        {isAdmin && (
          <button
            onClick={() => setPage('admin')}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-semibold mb-3 flex items-center justify-center gap-2 shadow-md"
          >
            <Shield className="w-4 h-4" />
            Open Admin Panel
          </button>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3.5 rounded-xl text-sm font-semibold border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;