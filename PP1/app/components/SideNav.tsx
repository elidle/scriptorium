import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeProvider, Box, Typography } from '@mui/material';
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

const SideNav = ({ router }: { router: ReturnType<typeof useRouter> }) => {
  const pathname = usePathname();
  const { user, setUser, setAccessToken } = useAuth();
  const { theme, isDarkMode } = useTheme();

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link 
      href={href}
      style={{ textDecoration: 'none' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          transition: 'all 0.2s ease-in-out',
          color: isActive(href) ? 'primary.main' : 'text.secondary',
          bgcolor: isActive(href) 
            ? (isDarkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)')
            : 'transparent',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            color: 'primary.main',
          },
        }}
      >
        {children}
      </Box>
    </Link>
  );

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          px: 1,
          mb: 1,
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        {title}
      </Typography>
      <Box
        component="nav"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: '100%',
          overflowY: 'auto',
          pt: '80px',
          px: 2,
          bgcolor: 'background.paper',
        }}
      >
        <NavSection title="Code">
          <NavLink href="/code-templates/editor">
            <Code size={18} /> Run Code
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
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
                    color: 'primary.main',
                  },
                }}
              >
                <LogOut size={18}/> Logout
              </Box>
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
      </Box>
    </ThemeProvider>
  );
};

export default SideNav;