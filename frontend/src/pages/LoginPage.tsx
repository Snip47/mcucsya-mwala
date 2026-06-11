import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Shield, Users, Crown, User } from 'lucide-react';

type RoleType = 'member' | 'leader' | 'mp' | 'admin';

const ROLES = [
  { id: 'member' as RoleType, label: 'Member',  icon: User,   color: '#1a3a6a', desc: 'Youth/comrade'       },
  { id: 'leader' as RoleType, label: 'Leader',  icon: Users,  color: '#2d1b69', desc: 'Chapter leader'       },
  { id: 'mp'     as RoleType, label: 'MP',       icon: Crown,  color: '#8b0000', desc: 'Member of Parliament' },
  { id: 'admin'  as RoleType, label: 'Admin',    icon: Shield, color: '#1a1a1a', desc: 'System admin'         },
];

interface Props {
  onRegister: (role: string) => void;
}

const LoginPage: React.FC<Props> = ({ onRegister }) => {
  const { login }                       = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [nationalId,   setNationalId]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleLogin = async () => {
    if (!nationalId || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await login(nationalId, password, selectedRole!);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a3a1a 40%, #2d1b69 80%, #0a0a0a 100%)' }}>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1a3a1a, #c9a84c, #8b0000, #c9a84c, #1a3a1a)' }} />

      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <img src="/logo.png" alt="MCUCSYA" className="w-24 h-24 object-contain mb-3"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.7))' }} />
        <h1 className="text-white text-2xl font-bold tracking-wide">MCUCSYA</h1>
        <p className="text-yellow-400 text-sm font-semibold mt-0.5">Mwala Chapter</p>
        <p className="text-gray-300 text-xs text-center mt-1 px-4 leading-relaxed">
          Machakos County University & Colleges Students Youth Association
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-px w-10" style={{ background: '#c9a84c' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
          <div className="h-px w-10" style={{ background: '#c9a84c' }} />
        </div>
      </div>

      {!selectedRole ? (
        <div className="flex-1 px-5 pb-8">
          <p className="text-gray-300 text-sm text-center mb-4 font-medium">Select your role to continue</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {ROLES.map(role => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  style={{
                    background:     role.color,
                    border:         '1.5px solid rgba(201,168,76,0.25)',
                    boxShadow:      '0 4px 20px rgba(0,0,0,0.4)',
                    borderRadius:   '16px',
                    padding:        '20px 12px',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    color:          'white',
                    cursor:         'pointer',
                    minHeight:      '110px',
                    justifyContent: 'center',
                  }}
                >
                  <Icon style={{ width: 32, height: 32, marginBottom: 8 }} />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{role.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.6, marginTop: 2, textAlign: 'center' }}>{role.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white bg-opacity-10 rounded-2xl p-4 border border-white border-opacity-10">
            <p className="text-yellow-400 text-xs font-semibold mb-2">Important:</p>
            <div className="space-y-1 text-xs text-gray-300">
              <p>• Members get instant access after registration</p>
              <p>• Leaders and MPs need admin approval</p>
              <p>• Each role has a dedicated dashboard</p>
              <p>• You cannot switch roles after registration</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => { setSelectedRole(null); setError(''); }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#f0f0f0', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 'bold', cursor: 'pointer', color: '#333'
              }}>
              ←
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium"
              style={{ background: ROLES.find(r => r.id === selectedRole)?.color }}>
              {React.createElement(ROLES.find(r => r.id === selectedRole)!.icon, { className: 'w-4 h-4' })}
              <span>{ROLES.find(r => r.id === selectedRole)?.label} Login</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-5">
            Sign in to your {ROLES.find(r => r.id === selectedRole)?.label} dashboard
          </p>

          {selectedRole === 'admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-yellow-800 text-xs font-medium">🔒 Restricted — authorized admin only</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">National ID Number</label>
            <input value={nationalId} onChange={e => setNationalId(e.target.value)}
              placeholder="e.g. 12345678" type="number"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none bg-gray-50" />
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none pr-12 bg-gray-50" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-gray-400">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-60 shadow-lg mb-4"
            style={{ background: ROLES.find(r => r.id === selectedRole)?.color }}>
            {loading ? 'Signing in...' : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
          </button>

          {selectedRole !== 'admin' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button onClick={() => onRegister(selectedRole)}
                className="w-full py-4 rounded-xl font-semibold text-sm border-2"
                style={{ borderColor: ROLES.find(r => r.id === selectedRole)?.color, color: ROLES.find(r => r.id === selectedRole)?.color }}>
                Register as {ROLES.find(r => r.id === selectedRole)?.label}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                {selectedRole === 'member' ? '✅ Instant access after registration' : '⏳ Admin approval required before login'}
              </p>
            </>
          )}
        </div>
      )}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1a3a1a, #c9a84c, #8b0000, #c9a84c, #1a3a1a)' }} />
    </div>
  );
};

export default LoginPage;