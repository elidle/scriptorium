import {
  AppBar as MuiAppBar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  ThemeProvider, Avatar,
} from "@mui/material";
import { Menu, Search, X } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import UserAvatar from './UserAvatar';
import { useTheme } from "@/app/contexts/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";

import { User } from "@/app/types/auth";

interface AppBarProps {
  user: User;
  onMenuClick: () => void;
}

export default function AppBarProfile({user, onMenuClick }: AppBarProps) {
  const { theme, isDarkMode } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  const renderUserSection = () => (
    user ? (
      <div className="flex items-center gap-2">
        <UserAvatar username={user.username} userId={user.id} />
        <Link href={`/users/${user.username}`}>
          <Typography
            className={`hidden sm:block hover:text-blue-400 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            {user.username}
          </Typography>
        </Link>
      </div>
    ) : (
      <Link href="/auth/login">
        <Button
          className={`
            px-4 sm:px-6 min-w-[90px] sm:min-w-[100px] 
            whitespace-nowrap h-8 sm:h-9 text-sm sm:text-base
            bg-blue-600 hover:bg-blue-700
            text-white
          `}
          variant="contained"
          size="small"
        >
          Log In
        </Button>
      </Link>
    )
  );

  return (
    <ThemeProvider theme={theme}>
      <MuiAppBar
        position="fixed"
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: 1,
          borderColor: isDarkMode ? 'rgb(51 65 85)' : 'rgb(226 232 240)',
          boxShadow: 'none',
        }}
      >
        <div className="p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
          {/* Left section */}
          <div className="flex-none flex items-center gap-2 sm:gap-3">
            <IconButton
              onClick={onMenuClick}
              size={isMobile ? "small" : "medium"}
              sx={{
                p: 1,
                color: isDarkMode ? 'rgb(203 213 225)' : 'rgb(51 65 85)',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgb(51 65 85)' : 'rgb(226 232 240)',
                },
              }}
            >
              <Menu size={isMobile ? 20 : 24} />
            </IconButton>
            <Link href="/" className={"flex gap-1 align-middle"}>
              <Avatar
                src="/favicon.ico"
                alt="Scriptorium"
                />
              <Typography
                variant="h5"
                className="text-lg sm:text-xl md:text-2xl content-center text-blue-600 flex-shrink-0"
              >
                Scriptorium
              </Typography>
            </Link>
          </div>

          {/* Center section - Search */}
          <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="h4">User Profile</Typography>
          </Box>

          {/* Right section */}
          <div className="flex-none flex items-center gap-2">
            <ThemeToggle />
            {isMobile && (
              <IconButton
                onClick={toggleMobileSearch}
                size="small"
                sx={{
                  p: 1,
                  color: isDarkMode ? 'rgb(203 213 225)' : 'rgb(51 65 85)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgb(51 65 85)' : 'rgb(226 232 240)',
                  },
                }}
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </IconButton>
            )}
            {renderUserSection()}
          </div>
        </div>
      </MuiAppBar>

      {/* Add a spacer to prevent content from hiding under the AppBar */}
      <div className={`h-14 sm:h-16 ${isMobile && mobileSearchOpen ? 'h-24' : ''}`} />
    </ThemeProvider>
  );
}