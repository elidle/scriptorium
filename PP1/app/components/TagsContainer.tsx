import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  Fade,
  Checkbox, alpha
} from '@mui/material';
import {Tags, Plus, RefreshCw, X, Search} from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';
import debounce from 'lodash.debounce';
import { mode } from "@/app/types";
import { Tag } from "@/app/types";

interface TagsContainerProps {
  tags: Tag[];
  selectedTags: string[];
  mode?: mode;
  onTagsChange?: (tags: string[]) => void;
}

const TagsContainer = ({
  tags: initialTags,
  selectedTags,
  mode = 'create',
  onTagsChange
}: TagsContainerProps) => {
  const [filteredTags, setFilteredTags] = useState<Tag[]>(initialTags);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState('');


  const handleNewTag = () => {
    if (mode === 'view') return;

    const trimmedTagName = newTagName.trim().toLowerCase();

    // Validation checks
    if (!trimmedTagName) {
      setTagError('Tag name cannot be empty');
      return;
    }

    // Check for duplicates (case insensitive)
    const isDuplicate = initialTags.some(tag => tag.name.toLowerCase() === trimmedTagName);
    if (isDuplicate) {
      setTagError('Tag already exists');
      return;
    }

    onTagsChange?.([...selectedTags, trimmedTagName]);
    setNewTagName('');
    setTagError('');
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewTag();
    }
  };

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
      onTagsChange?.(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange?.([...selectedTags, tagName]);
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
    onTagsChange?.([]);
  };

  if (mode === 'view') {
    return (
      <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Tags className="w-5 h-5" />
          <Typography variant="h6" sx={{ ml: 1 }}>Tags</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedTags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              sx={{
                borderRadius: '6px',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  if (mode === 'search') {
    return (
      <Paper
        elevation={3}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          p: 3
        }}
      >

        {/* Search Bar */}
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          mb: 3
        }}>
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
                transition: 'all 0.2s',
                bgcolor: 'background.default',
                '&:hover': {
                  transform: 'rotate(180deg)',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                },
              }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
            maxHeight: '100px', // Add maximum height
            overflowY: 'auto', // Enable vertical scrolling
            overflowX: 'hidden', // Hide horizontal scrollbar
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}>
            <Tooltip title="Clear selection">
              <IconButton
                size="small"
                onClick={handleClearSelected}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main'
                  }
                }}
              >
                <X className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
            }}>
              {selectedTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleChange(tag)}
                  color="primary"
                  size="medium"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiChip-label': {
                      px: 2,
                      py: 0.75,
                      fontWeight: 500
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Fade in>
            <Typography
              color="error"
              variant="caption"
              sx={{
                display: 'block',
                mb: 2,
                p: 1.5,
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.main'
              }}
            >
              {error}
            </Typography>
          </Fade>
        )}

        {/* Tags List */}
        <Paper
          elevation={0}
          sx={{
            maxHeight: 200,
            overflow: 'auto',
            borderRadius: 2,
            bgcolor: 'background.default',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
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
              <CircularProgress size={28} />
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
            <Box sx={{ p: 1.5 }}>
              {filteredTags.map((tag, index) => (
                <Box
                  key={index}
                  sx={{
                    mx: 1,
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 1,
                    },
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleChange(tag.name)}
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.name)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      }
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 1.5,
                      flex: 1,
                      fontWeight: selectedTags.includes(tag.name) ? 500 : 400,
                      color: selectedTags.includes(tag.name) ? 'primary.main' : 'text.primary'
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
  }

  return (
    <Paper
      elevation={3}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Add New Tag Section */}
      <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'primary.main',
            fontWeight: 500
          }}>
            <Plus className="w-5 h-5" />
            Add New Tag
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                setTagError('');
              }}
              onKeyDown={handleNewTagKeyDown}
              placeholder="Enter new tag name"
              error={Boolean(tagError)}
              helperText={tagError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'background.default',
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleNewTag}
              startIcon={<Plus className="w-4 h-4" />}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                px: 3
              }}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Tags Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'primary.main',
            fontWeight: 500
          }}>
            <Tags className="w-5 h-5" />
            Available Tags
            {selectedTags.length > 0 && (
              <Tooltip title="Clear all selected">
                <IconButton
                  size="small"
                  onClick={handleClearSelected}
                  sx={{
                    ml: 'auto',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </IconButton>
              </Tooltip>
            )}
          </Typography>

          {/* Search Bar */}
          <Box sx={{
            display: 'flex',
            gap: 1.5,
            mb: 3
          }}>
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
                  transition: 'all 0.2s',
                  bgcolor: 'background.default',
                  '&:hover': {
                    transform: 'rotate(180deg)',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                  },
                }}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <Box sx={{
              mb: 3,
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              maxHeight: '100px', // Add maximum height
              overflowY: 'auto', // Enable vertical scrolling
              overflowX: 'hidden', // Hide horizontal scrollbar
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
            }}>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
              }}>
                {selectedTags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleChange(tag)}
                    color="primary"
                    size="medium"
                    sx={{
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        px: 2,
                        py: 0.75,
                        fontWeight: 500
                      }
                    }}
                  />
                  ))}
                </Box>
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Fade in>
              <Typography
                color="error"
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 2,
                  p: 1.5,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'error.main'
                }}
              >
                {error}
              </Typography>
            </Fade>
          )}

          {/* Tags List */}
          <Paper
            elevation={0}
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              borderRadius: 2,
              bgcolor: 'background.default',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
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
                <CircularProgress size={28} />
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
              <Box sx={{ p: 1.5 }}>
                {filteredTags.map((tag, index) => (
                  <Box
                    key={index}
                    sx={{
                      mx: 1,
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1,
                      },
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleChange(tag.name)}
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.name)}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        }
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        ml: 1.5,
                        flex: 1,
                        fontWeight: selectedTags.includes(tag.name) ? 500 : 400,
                        color: selectedTags.includes(tag.name) ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {tag.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};

export default TagsContainer;