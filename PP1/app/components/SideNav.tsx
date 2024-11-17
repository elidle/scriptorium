import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  Code,
  Search,
  PenSquare,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Flag
} from 'lucide-react';

const SideNav = () => {
  const pathname = usePathname();
  const { user, setUser, setAccessToken } = useAuth();

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
  };

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} 
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors
        ${isActive(href) 
          ? 'bg-blue-600/20 text-blue-400' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-blue-400'
        }`}>
      {children}
    </Link>
  );

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-slate-500 text-sm font-medium mb-2 px-2">{title}</h3>
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 pt-20 px-4">
      <NavSection title="Code">
        <NavLink href="/code-templates/editor">
          <Code size={18} /> Run Code
        </NavLink>
        <NavLink href="/code-templates/search">
          <Search size={18} /> Code Templates
        </NavLink>
      </NavSection>

      <NavSection title="Blog">
        <NavLink href="/blog-posts/submit">
          <PenSquare size={18} /> Submit Post
        </NavLink>
        <NavLink href="/blog-posts/search">
          <Search size={18} /> Posts
        </NavLink>
      </NavSection>

      {user ? (
        <NavSection title="Account">
          <NavLink href={`/users/${user.username}`}>
            <User size={18} /> Profile
          </NavLink>
          <Link href="/blog-posts/search"
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors">
            <LogOut size={18} /> Logout
          </Link>
        </NavSection>
      ) : (
        <NavSection title="Account">
          <NavLink href="/auth/login">
            <LogIn size={18} /> Login
          </NavLink>
          <NavLink href="/auth/signup">
            <UserPlus size={18} /> Signup
          </NavLink>
        </NavSection>
      )}

      {user?.role === 'admin' && (
        <NavSection title="Admin">
          <NavLink href="/admin/post-reports">
            <Shield size={18} /> Reported Posts
          </NavLink>
          <NavLink href="/admin/comment-reports">
            <Flag size={18} /> Reported Comments
          </NavLink>
        </NavSection>
      )}
    </aside>
  );
};

export default SideNav;