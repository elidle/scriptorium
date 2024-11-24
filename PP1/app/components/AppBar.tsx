import {
  AppBar as MuiAppBar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  ThemeProvider,
  Avatar
} from "@mui/material";
import { Menu, Search, X } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import UserAvatar from './UserAvatar';
import SearchBar from './SearchBar';
import { useTheme } from "@/app/contexts/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";

interface AppBarProps {
  type: 'post' | 'code-template';
  user: any;
  onSearch: (searchTerm: string) => void;
  onMenuClick: () => void;
}

export default function AppBar({ type, user, onSearch, onMenuClick }: AppBarProps) {
  const { theme, isDarkMode } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  const renderSearch = () => (
    <SearchBar
      onSearch={onSearch}
      placeholder={`Search ${type === 'post' ? 'posts' : 'code templates'}...`}
      className="w-full max-w-2xl"
    />
  );

  const renderUserSection = () => (
    user ? (
      <div className="flex items-center gap-2">
        <UserAvatar username={user.username} userId={user.id} />
        <Link href={`/users/${user.username}`}>
          <Typography
            sx={{ 
              display: { xs: 'none', md: 'block' },
              color: theme.palette.text.primary,
              '&:hover': { color: theme.palette.primary.light }
            }}
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
          borderColor: theme.palette.divider,
          boxShadow: 'none',
        }}
      >
        <div className="p-2 sm:p-3 flex items-center">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <IconButton
              onClick={onMenuClick}
              size={isMobile ? "small" : "medium"}
              sx={{
                p: 1,
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.grey[isDarkMode ? 700 : 200],
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
              {/* <Typography
                variant="h5"
                className="text-lg sm:text-xl md:text-2xl content-center text-blue-600 flex-shrink-0"
                sx={{
                  display: { xs: 'none', md: 'block' }
                }}
              > */}
              <Typography
                variant="h5"
                className="hidden md:block text-lg sm:text-xl md:text-2xl content-center text-blue-600 flex-shrink-0"
              >
                Scriptorium
              </Typography>
            </Link>
          </div>

          {/* Center section - Search */}
          {!isMobile && (
            <Box sx={{ 
              flex: '1 1 auto', 
              display: 'flex', 
              justifyContent: 'center'
            }}>
              {renderSearch()}
            </Box>
          )}

          {/* Right section */}
          <div className="ml-auto flex items-center justify-end gap-2">
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
            <ThemeToggle />
            {renderUserSection()}
          </div>
        </div>

        {/* Mobile search bar */}
        {isMobile && mobileSearchOpen && (
          <div
            className="p-2 border-t"
            style={{
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
            }}
          >
            {renderSearch()}
          </div>
        )}
      </MuiAppBar>

      {/* Add a spacer to prevent content from hiding under the AppBar */}
      <div className={`h-14 sm:h-16 ${isMobile && mobileSearchOpen ? 'h-24' : ''}`} />
    </ThemeProvider>
  );
}