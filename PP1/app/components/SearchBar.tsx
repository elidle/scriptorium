import React, { useState, useEffect } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Fade,
  Box,
  Typography,
  ThemeProvider,
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

  // Color schemes for dark and light modes
  const colors = {
    paper: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#2d3748' : '#e2e8f0',
    hoverBg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
    text: isDarkMode ? '#e2e8f0' : '#1a202c',
    secondaryText: isDarkMode ? '#94a3b8' : '#64748b',
    focusBorder: '#3b82f6',
    dropdownBg: isDarkMode ? '#1e293b' : '#ffffff',
    headerBg: isDarkMode ? '#1e293b' : '#f8fafc',
  };

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
    <ThemeProvider theme={theme}>
      <Box
        className={className}
        sx={{
          position: 'relative',
          width: '100%'
        }}
      >
        <form onSubmit={handleSubmit}>
          <Paper
            elevation={isFocused ? 4 : 1}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '12px',
              border: isFocused ? `2px solid ${colors.focusBorder}` : `2px solid ${colors.border}`,
              width: '100%',
              backgroundColor: colors.paper,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <Search className="h-5 w-5" style={{ color: colors.secondaryText }} />
            </IconButton>
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
                color: colors.text,
                '& ::placeholder': {
                  color: colors.secondaryText,
                  opacity: 1
                }
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
                  <X className="h-4 w-4" style={{ color: colors.secondaryText }} />
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
              width: '100%',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: colors.dropdownBg,
              border: `1px solid ${colors.border}`,
              boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                  color: colors.secondaryText,
                  position: 'sticky',
                  top: 0,
                  bgcolor: colors.headerBg,
                  zIndex: 1,
                  borderBottom: `1px solid ${colors.border}`,
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
                    color: colors.text,
                    transition: 'background-color 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: colors.hoverBg,
                    },
                  }}
                  onClick={() => handleRecentSearch(term)}
                >
                  <Search className="h-4 w-4" style={{ color: colors.secondaryText }} />
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'inherit'
                    }}
                  >
                    {term}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default SearchBar;