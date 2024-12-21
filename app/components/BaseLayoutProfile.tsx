import AppBarProfile from './AppBarProfile';
import SideNav from './SideNav';
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useTheme} from "@/app/contexts/ThemeContext";

import { User } from "@/app/types/auth";

interface BaseLayoutPropsProfile {
  children: React.ReactNode;
  user: User;
}

export default function BaseLayoutProfile({ children, user}: BaseLayoutPropsProfile) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className={`flex ${isDarkMode ? 'bg-slate-900' : 'bg-slate-300'} min-h-screen`}>
      {/* Overlay for sidenav */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isSideNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSideNavOpen(false)}
      />

      {/* Left sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-50 transition-transform duration-300 transform ${
          isSideNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <SideNav router={router}/>
      </div>

      <div className="flex-1 transition-all duration-300">
        <AppBarProfile
          user={user}
          onMenuClick={() => setIsSideNavOpen(!isSideNavOpen)}
        />

        {/* Content area */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}