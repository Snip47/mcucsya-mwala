import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Shield, Users, Crown, User, Fingerprint } from 'lucide-react';

type RoleType = 'member' | 'leader' | 'mp' | 'admin';

const ROLES = [
  { id: 'member' as RoleType, label: 'Member',  icon: User,   color: '#1a3a6a', desc: 'Student member'        },
  { id: 'leader' as RoleType, label: 'Leader',  icon: Users,  color: '#2d1b69', desc: 'Chapter leader'        },
  { id: 'mp'     as RoleType, label: 'MP',       icon: Crown,  color: '#8b0000', desc: 'Member of Parliament'  },
  { id: 'admin'  as RoleType, label: 'Admin',    icon: Shield, color: '#1a1a1a', desc: 'System administrator'  },
];

interface Props {
  onRegister: (role: string) => void;
}

const LoginPage: React.FC<Props> = ({ onRegister }) => {
  const { login }                         = useAuth();
  const [selectedRole, setSelectedRole]   = useState<RoleType | null>(null);
  const [nationalId,   setNationalId]     = useState('');
  const [password,     setPassword]       = useState('');
  const [showPass,     setShowPass]       = useState(false);
  const [loading,      setLoading]        = useState(false);
  const [error,        setError]          = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(ok => setBiometricAvailable(ok))
        .catch(() => setBiometricAvailable(false));
    }
  }, []);

  const saveBiometricCredentials = (id: string, role: string, pass: string) => {
    localStorage.setItem('bio_id',   id);
    localStorage.setItem('bio_role', role);
    localStorage.setItem('bio_pass', pass);
  };

  const handleLogin = async () => {
    if (!nationalId || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await login(nationalId, password, selectedRole!);
      saveBiometricCredentials(nationalId, selectedRole!, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const savedId   = localStorage.getItem('bio_id');
    const savedRole = localStorage.getItem('bio_role');
    const savedPass = localStorage.getItem('bio_pass');

    if (!savedId || !savedRole || !savedPass) {
      setError('No saved credentials. Login with password first to enable biometrics.');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout:          60000,
          userVerification: 'required',
          rpId:             window.location.hostname,
        }
      } as any);

      setLoading(true);
      await login(savedId, savedPass, savedRole as RoleType);
    } catch {
      setError('Biometric failed. Please use password login.');
    } finally {
      setLoading(false);
    }
  };

  const savedBioRole = localStorage.getItem('bio_role');
  const hasSavedBio  = !!localStorage.getItem('bio_id');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a3a1a 40%, #2d1b69 80%, #0a0a0a 100%)' }}>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1a3a1a, #c9a84c, #8b0000, #c9a84c, #1a3a1a)' }} />

      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <img src="/logo.png" alt="MCUCSYA" className="w-28 h-28 object-contain mb-3"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.7))' }} />
        <h1 className="text-white text-2xl font-bold tracking-wide">MCUCSYA</h1>
        <p className="text-yellow-400 text-sm font-semibold mt-0.5">Mwala Chapter</p>
        <p className="text-gray-300 text-xs text-center mt-1 px-4 leading-relaxed">
          Machakos County University & Colleges Students Youth Association
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-px w-12" style={{ background: '#c9a84c' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#c9a84c' }} />
          <div className="h-px w-12" style={{ background: '#c9a84c' }} />
        </div>
      </div>

      {!selectedRole ? (
        <div className="flex-1 px-5 pb-8">
          <p className="text-gray-300 text-sm text-center mb-4 font-medium">Select your role to continue</p>

          {/* Biometric quick login */}
          {biometricAvailable && hasSavedBio && (
            <button onClick={handleBiometric}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-4 text-white font-semibold"
              style={{ background: 'rgba(201,168,76,0.2)', border: '1.5px solid #c9a84c' }}>
              <Fingerprint className="w-6 h-6" style={{ color: '#c9a84c' }} />
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: '#c9a84c' }}>Sign in with Biometrics</p>
                <p className="text-xs text-gray-300">as {savedBioRole}</p>
              </div>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            {ROLES.map(role => {
              const Icon = role.icon;
              return (
                <button key={role.id} onClick={() => setSelectedRole(role.id)}
                  className="flex flex-col items-center py-5 px-3 rounded-2xl text-white active:scale-95 transition-transform"
                  style={{ background: role.color, border: '1.5px solid rgba(201,168,76,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="font-bold text-base">{role.label}</span>
                  <span className="text-xs opacity-60 mt-0.5 text-center">{role.desc}</span>
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
            <button onClick={() => { setSelectedRole(null); setError(''); }}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
              ←
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium"
              style={{ background: ROLES.find(r => r.id === selectedRole)?.color }}>
              {React.createElement(ROLES.find(r => r.id === selectedRole)!.icon, { className: 'w-4 h-4' })}
              <span>{ROLES.find(r => r.id === selectedRole)?.label} Login</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-5">Sign in to your {ROLES.find(r => r.id === selectedRole)?.label} dashboard</p>

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
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none bg-gray-50 focus:border-green-500 transition" />
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none pr-12 bg-gray-50 focus:border-green-500 transition" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-gray-400">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-60 shadow-lg mb-3 transition"
            style={{ background: ROLES.find(r => r.id === selectedRole)?.color }}>
            {loading ? 'Signing in...' : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
          </button>

          {biometricAvailable && hasSavedBio && savedBioRole === selectedRole && (
            <button onClick={handleBiometric}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium mb-3 transition hover:border-gray-300">
              <Fingerprint className="w-5 h-5" />
              Sign in with Biometrics
            </button>
          )}

          {selectedRole !== 'admin' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button onClick={() => onRegister(selectedRole)}
                className="w-full py-4 rounded-xl font-semibold text-sm border-2 transition"
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