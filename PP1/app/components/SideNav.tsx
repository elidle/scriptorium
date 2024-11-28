import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Code,
  Search,
  PenSquare,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Flag,
  Eye
} from 'lucide-react';
import {logoutUser} from "@/app/utils/auth";

const SideNav = ({ router }: { router: ReturnType<typeof useRouter> }) => {
  const pathname = usePathname();
  const { user, setUser, setAccessToken } = useAuth();
  const { isDarkMode } = useTheme();

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setAccessToken(null);
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href}
      className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200
        ${isActive(href) 
          ? isDarkMode
            ? 'bg-blue-600/20 text-blue-400'
            : 'bg-blue-50 text-blue-600'
          : isDarkMode
            ? 'text-slate-400 hover:bg-slate-800/80 hover:text-blue-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
        }`}>
      {children}
    </Link>
  );

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className={`px-2 mb-2 text-sm font-medium
        ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
        {title}
      </h3>
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );

  return (
    <div className={`h-full overflow-y-auto pt-20 px-4
      ${isDarkMode 
        ? 'bg-slate-900 border-r border-slate-800'
        : 'bg-white border-r border-slate-200'}`}>
      <NavSection title="Code">
        <NavLink href="/code-templates/new">
          <Code size={18}/> Run Code
        </NavLink>
        <NavLink href="/code-templates/search">
          <Search size={18}/> Code Templates
        </NavLink>
      </NavSection>

      <NavSection title="Blog">
        <NavLink href="/blog-posts/submit">
          <PenSquare size={18}/> Submit Post
        </NavLink>
        <NavLink href="/blog-posts/search">
          <Search size={18}/> Posts
        </NavLink>
      </NavSection>

      {user ? (
        <NavSection title="Account">
          <NavLink href={`/users/${user.username}`}>
            <User size={18}/> Profile
          </NavLink>
          <Link
            href="/blog-posts/search"
            onClick={handleLogout}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200
              ${isDarkMode
                ? 'text-slate-400 hover:bg-slate-800/80 hover:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'}`}>
            <LogOut size={18}/> Logout
          </Link>
        </NavSection>
      ) : (
        <NavSection title="Account">
          <NavLink href="/auth/login">
            <LogIn size={18}/> Login
          </NavLink>
          <NavLink href="/auth/signup">
            <UserPlus size={18}/> Signup
          </NavLink>
        </NavSection>
      )}

      {user?.role === 'admin' && (
        <NavSection title="Admin">
          <NavLink href="/admin/post-reports">
            <Shield size={18}/> Reported Posts
          </NavLink>
          <NavLink href="/admin/comment-reports">
            <Flag size={18}/> Reported Comments
          </NavLink>
          <NavLink href="/admin/unhide">
            <Eye size={18}/> Unhide
          </NavLink>
        </NavSection>
      )}
    </div>
  );
};

export default SideNav;