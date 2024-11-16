import React, { useState, useEffect } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Tooltip,
  Fade,
  Box,
  Typography,
  Chip,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { Search, X, History, Sparkles, Command } from 'lucide-react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

const searchTheme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b', // slate-800
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#334155', // slate-700
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#f8fafc', // slate-50
          '&::placeholder': {
            color: '#94a3b8', // slate-400
            opacity: 1,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155', // slate-700
          color: '#cbd5e1', // slate-300
          '&:hover': {
            backgroundColor: '#475569', // slate-600
          },
        },
      },
    },
  },
});

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      // Save to recent searches
      const updatedSearches = [
        searchTerm.trim(),
        ...recentSearches.filter(s => s !== searchTerm.trim())
      ].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleRecentSearch = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
    setShowSuggestions(false);
  };

  return (
    <ThemeProvider theme={searchTheme}>
      <Box className={className}>
        <form onSubmit={handleSubmit}>
          <Paper
            elevation={isFocused ? 4 : 1}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '12px',
              border: isFocused ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <Search className="h-5 w-5 text-slate-400" />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                // Delayed hide for click handling
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {searchTerm && (
              <Fade in={true}>
                <IconButton
                  sx={{ p: '10px' }}
                  aria-label="clear"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4 text-slate-400" />
                </IconButton>
              </Fade>
            )}
          </Paper>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && (recentSearches.length > 0) && (
          <Paper
            sx={{
              mt: 1,
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'absolute',
              width: '100%',
              zIndex: 1000,
            }}
          >
            <Box sx={{ p: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.secondary'
                }}
              >
                <History className="h-4 w-4" />
                Recent Searches
              </Typography>
              {recentSearches.map((term, index) => (
                <Box
                  key={index}
                  sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                  onClick={() => handleRecentSearch(term)}
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <Typography variant="body2">{term}</Typography>
                </Box>
              ))}
            </Box>

            {/* Quick tips */}
            <Box sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              p: 1.5,
              display: 'flex',
              gap: 2,
            }}>
            </Box>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default SearchBar;