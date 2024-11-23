import {
  AppBar as MuiAppBar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import { Menu, Search, X } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import UserAvatar from './UserAvatar';
import SearchBar from './SearchBar';

interface AppBarProps {
  type: 'post' | 'code-template';
  user: any;
  onSearch: (searchTerm: string) => void;
  onMenuClick: () => void;
}

export default function AppBar({ type, user, onSearch, onMenuClick }: AppBarProps) {
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
          <Typography className="text-slate-200 hover:text-blue-400 hidden sm:block">
            {user.username}
          </Typography>
        </Link>
      </div>
    ) : (
      <Link href="/auth/login">
        <Button
          className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 min-w-[90px] sm:min-w-[100px] whitespace-nowrap h-8 sm:h-9 text-sm sm:text-base"
          variant="contained"
          size="small"
        >
          Log In
        </Button>
      </Link>
    )
  );

  return (
    <>
      <MuiAppBar
        position="fixed"
        className="!bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
          {/* Left section */}
          <div className="flex-none flex items-center gap-2 sm:gap-3">
            <IconButton
              onClick={onMenuClick}
              className="p-1 text-slate-300 hover:bg-slate-700"
              size={isMobile ? "small" : "medium"}
            >
              <Menu size={isMobile ? 20 : 24} />
            </IconButton>
            <Link href="/">
              <Typography
                className="text-lg sm:text-xl md:text-2xl text-blue-400 flex-shrink-0"
                variant="h5"
              >
                Scriptorium
              </Typography>
            </Link>
          </div>

          {/* Center section - Search */}
          {!isMobile && (
            <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
              {renderSearch()}
            </Box>
          )}

          {/* Right section */}
          <div className="flex-none flex items-center gap-2">
            {isMobile && (
              <IconButton
                onClick={toggleMobileSearch}
                className="p-1 text-slate-300 hover:bg-slate-700"
                size="small"
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </IconButton>
            )}
            {renderUserSection()}
          </div>
        </div>

        {/* Mobile search bar */}
        {isMobile && mobileSearchOpen && (
          <div className="p-2 bg-slate-800 border-t border-slate-700">
            {renderSearch()}
          </div>
        )}
      </MuiAppBar>

      {/* Add a spacer to prevent content from hiding under the AppBar */}
      <div className={`h-14 sm:h-16 ${isMobile && mobileSearchOpen ? 'h-24' : ''}`} />
    </>
  );
}