// components/BaseLayout.tsx
import AppBar from './AppBar';
import SideNav from './SideNav';
import {useState} from "react";
import {useRouter} from "next/navigation";

interface BaseLayoutProps {
  children: React.ReactNode;
  user: any;
  onSearch: (searchTerm: string) => void;
  type: 'post' | 'code-template';
}

export default function BaseLayout({ children, user, onSearch, type }: BaseLayoutProps) {
  const router = useRouter();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-900">
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
        <AppBar
          user={user}
          onSearch={onSearch}
          onMenuClick={() =>   setIsSideNavOpen(!isSideNavOpen)}
          type={type}
        />

        {/* Content area */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}