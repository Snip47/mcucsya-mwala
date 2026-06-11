import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MemberDashboard from './pages/MemberDashboard';
import LeaderDashboard from './pages/LeaderDashboard';
import MPDashboard from './pages/MPDashboard';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import BottomNav from './components/BottomNav';
import { Home, Briefcase, BookOpen, Calendar, User, Users } from 'lucide-react';
const AppContent: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const [page,      setPage]       = useState('home');
  const [showLogin, setShowLogin]  = useState(true);
  const [regRole,   setRegRole]    = useState('member');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <img src="/logo.png" alt="MCUCSYA" className="w-20 h-20 object-contain mb-4 animate-pulse" />
        <p className="text-green-700 font-bold text-lg">MCUCSYA Mwala</p>
        <p className="text-gray-400 text-sm mt-1">Loading...</p>
      </div>
    );
  }

  if (!user) {
    if (!showLogin) {
      return <RegisterPage role={regRole} onBack={() => setShowLogin(true)} />;
    }
    return <LoginPage onRegister={role => { setRegRole(role); setShowLogin(false); }} />;
  }

 const renderPage = () => {
  if (page === 'admin'   && isAdmin) return <AdminPage setPage={setPage} />;
  if (page === 'profile')            return <ProfilePage setPage={setPage} />;

  if (user.role === 'admin') {
    // Admin sees leader dashboard for all non-admin pages
    return <LeaderDashboard page={page} />;
  }
  if (user.role === 'mp') {
    return <MPDashboard page={page} />;
  }
  if (user.role === 'leader') {
    return <LeaderDashboard page={page} />;
  }
  return <MemberDashboard page={page} />;
};
 const getNavTabs = () => {
  if (user.role === 'leader') {
    return [
      { id: 'home',    label: 'Home',    icon: Home        },
      { id: 'jobs',    label: 'Jobs',    icon: Briefcase   },
      { id: 'bursary', label: 'Bursary', icon: BookOpen    },
      { id: 'events',  label: 'Events',  icon: Calendar    },
      { id: 'leaders', label: 'Leaders', icon: Users       },
      { id: 'profile', label: 'Profile', icon: User        },
    ];
  }
  if (user.role === 'mp') {
    return [
      { id: 'home',    label: 'Home',    icon: Home        },
      { id: 'jobs',    label: 'Jobs',    icon: Briefcase   },
      { id: 'bursary', label: 'Bursary', icon: BookOpen    },
      { id: 'events',  label: 'Events',  icon: Calendar    },
      { id: 'leaders', label: 'Leaders', icon: Users       },
      { id: 'profile', label: 'Profile', icon: User        },
    ];
  }
  return [
    { id: 'home',    label: 'Home',    icon: Home        },
    { id: 'jobs',    label: 'Jobs',    icon: Briefcase   },
    { id: 'bursary', label: 'Bursary', icon: BookOpen    },
    { id: 'events',  label: 'Events',  icon: Calendar    },
    { id: 'leaders', label: 'Leaders', icon: Users       },
    { id: 'profile', label: 'Profile', icon: User        },
  ];
};
  return (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
      <BottomNav page={page} setPage={setPage} role={user.role} tabs={getNavTabs()} />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;