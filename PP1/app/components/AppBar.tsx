import {
  AppBar as MuiAppBar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Menu } from "lucide-react";
import Link from 'next/link';
import UserAvatar from './UserAvatar';
import SearchBar from './SearchBar';

interface AppBarProps {
  type: 'post' | 'code-template';
  user: any;
  onSearch: (searchTerm: string) => void;
  onMenuClick: () => void;
}

export default function AppBar({ type, user, onSearch, onMenuClick }: AppBarProps) {
  return (
    <MuiAppBar
      position="fixed"
      className="!bg-slate-800 border-b border-slate-700"
      sx={{ boxShadow: 'none' }}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="flex-none flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-slate-300" />
          </button>
          <Link href="/">
            <Typography
              className="text-xl sm:text-2xl text-blue-400 flex-shrink-0"
              variant="h5"
            >
              Scriptorium
            </Typography>
          </Link>
        </div>

        <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
          <SearchBar
            onSearch={onSearch}
            placeholder={`Search ${type === 'post' ? 'posts' : 'code templates'}...`}
            className="w-full max-w-2xl"
          />
        </Box>

        <div className="flex-none">
          {user ? (
            <div className="flex items-center gap-2">
              <UserAvatar username={user.username} userId={user.id} />
              <Link href={`/users/${user.username}`}>
                <Typography className="text-slate-200 hover:text-blue-400">
                  {user.username}
                </Typography>
              </Link>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
                variant="contained"
                size="small"
              >
                Log In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </MuiAppBar>
  );
}