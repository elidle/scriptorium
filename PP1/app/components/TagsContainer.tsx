import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  Badge,
  Fade,
  Divider
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { Tag } from "@/app/types";
import SearchBar from "@/app/components/SearchBar";
import { RefreshCw, Tags, X } from 'lucide-react';
import debounce from 'lodash.debounce';

interface TagsContainerProps {
  tags: Tag[];
  selectedTags: string[];
  handleSelectedTags: (tags: string[]) => void;
}

const TagsContainer: React.FC<TagsContainerProps> = ({
  tags: initialTags,
  selectedTags,
  handleSelectedTags
}) => {
  const [filteredTags, setFilteredTags] = useState<Tag[]>(initialTags);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const searchTags = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/api/tags/search/?q=${encodeURIComponent(query)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        setFilteredTags(data.tags || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search tags");
        setFilteredTags(initialTags);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [initialTags]
  );

  const refreshTags = async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/tags/search/?q=", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message);
      }

      setFilteredTags(data.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh tags");
      setFilteredTags(initialTags);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setFilteredTags(initialTags);
  }, [initialTags]);

  const handleChange = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      handleSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      handleSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTags(initialTags);
      return;
    }
    searchTags(term);
  };

  const handleClearSelected = () => {
    handleSelectedTags([]);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Tags className="w-5 h-5" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Tags
        </Typography>
        {selectedTags.length > 0 && (
          <Tooltip title="Clear all selected">
            <IconButton size="small" onClick={handleClearSelected}>
              <X className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Search and Refresh */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search tags..."
            />
          </Box>
          <Tooltip title="Refresh tags">
            <IconButton
              onClick={refreshTags}
              disabled={isRefreshing}
              color="primary"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 2
          }}>
            {selectedTags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleChange(tag)}
                color="primary"
                size="small"
                sx={{
                  borderRadius: '6px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Fade in>
          <Typography
            color="error"
            variant="caption"
            sx={{ px: 2, pb: 1, display: 'block' }}
          >
            {error}
          </Typography>
        </Fade>
      )}

      {/* Tags List */}
      <Paper
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          borderRadius: 0,
          bgcolor: 'background.default',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
      >
        {isSearching ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredTags.length === 0 ? (
          <Box sx={{
            p: 4,
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            {searchTerm ? 'No tags found' : 'No tags available'}
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>
            {filteredTags.map((tag, index) => (
              <Box
                key={index}
                sx={{
                  mx: 1,
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                  },
                  padding: '4px',
                }}
              >
                <Checkbox
                  checked={selectedTags.includes(tag.name)}
                  onChange={() => handleChange(tag.name)}
                  size="small"
                />
                <Typography
                  variant="body2"
                  sx={{
                    ml: 1,
                    flex: 1
                  }}
                >
                  {tag.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Paper>
  );
};

export default TagsContainer;