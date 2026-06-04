import React from 'react';
import { Home, Briefcase, BookOpen, Calendar, User, Users, LucideIcon } from 'lucide-react';

interface Tab {
  id:    string;
  label: string;
  icon:  LucideIcon;
}

interface Props {
  page:    string;
  setPage: (p: string) => void;
  role:    string;
  tabs?:   Tab[];
}

const DEFAULT_TABS: Tab[] = [
  { id: 'home',    label: 'Home',    icon: Home      },
  { id: 'jobs',    label: 'Jobs',    icon: Briefcase },
  { id: 'bursary', label: 'Bursary', icon: BookOpen  },
  { id: 'events',  label: 'Events',  icon: Calendar  },
  { id: 'profile', label: 'Profile', icon: User      },
];

const BottomNav: React.FC<Props> = ({ page, setPage, role, tabs = DEFAULT_TABS }) => {
  const activeColor = role === 'mp' ? '#8b0000' : role === 'leader' ? '#2d1b69' : role === 'admin' ? '#1a1a1a' : '#1a3a6a';

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-100 px-1 py-2 z-50 shadow-lg">
      <div className="flex justify-around">
        {tabs.map(tab => {
          const Icon     = tab.icon;
          const isActive = page === tab.id;
          return (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0">
              <Icon className="w-5 h-5 transition-colors" style={{ color: isActive ? activeColor : '#9ca3af' }} />
              <span className="text-xs font-semibold transition-colors truncate" style={{ color: isActive ? activeColor : '#9ca3af', fontSize: '10px' }}>
                {tab.label}
              </span>
              {isActive && <div className="w-4 h-0.5 rounded-full" style={{ background: activeColor }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;