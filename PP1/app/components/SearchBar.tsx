import React, { useState, useEffect } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Fade,
  Box,
  Typography,
} from '@mui/material';
import { Search, X, History } from 'lucide-react';
import { useTheme } from "@/app/contexts/ThemeContext";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
  className
}) => {
  const { theme, isDarkMode } = useTheme();
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
    onSearch(searchTerm.trim());
    if (searchTerm.trim()) {
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
    <Box className={className} sx={{ position: 'relative' }}>
      <form onSubmit={handleSubmit}>
        <Paper
          elevation={isFocused ? 4 : 1}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '12px',
            bgcolor: 'background.default',
            border: isFocused ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: theme.palette.grey[isDarkMode ? 700 : 200]
            },
          }}
        >
          <IconButton sx={{ p: '10px' }} aria-label="search">
            <Search className="h-5 w-5" sx={{ color: 'text.secondary' }} />
          </IconButton>
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
              color: 'text.primary',
              '& ::placeholder': {
                color: 'text.secondary',
                opacity: 1,
              },
            }}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
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
                <X className="h-4 w-4" sx={{ color: 'text.secondary' }} />
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
            left: 0,
            right: 0,
            width: 'auto',
            zIndex: 1000,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
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
              <History className="h-4 w-4" sx={{ color: 'text.secondary' }} />
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
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: theme.palette.grey[isDarkMode ? 700 : 200]
                  },
                }}
                onClick={() => handleRecentSearch(term)}
              >
                <Search className="h-4 w-4" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">{term}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 1.5,
            display: 'flex',
            gap: 2,
          }}>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;