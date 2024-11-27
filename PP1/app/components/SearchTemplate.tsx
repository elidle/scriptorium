import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Fade,
  Checkbox,
  alpha,
  Chip,
} from "@mui/material";
import {FileSearch, RefreshCw, Sparkles, X} from 'lucide-react';
import debounce from 'lodash.debounce';
import SearchBar from "@/app/components/SearchBar";
import { CodeTemplate } from "@/app/types";

const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface SearchTemplateProps {
  selectedTemplates: CodeTemplate[];
  onTemplateSelect: (templates: CodeTemplate[]) => void;
  mode: 'create' | 'search';
}

const SearchTemplate = ({
  selectedTemplates,
  onTemplateSelect,
  mode = 'create',
}: SearchTemplateProps) => {
  const [availableTemplates, setAvailableTemplates] = useState<CodeTemplate[]>([]);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [isRefreshingTemplates, setIsRefreshingTemplates] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");

  const searchTemplates = useCallback(
    debounce(async (query: string) => {
      setIsSearchingTemplates(true);
      setTemplateError("");

      try {
        const url = `${domain}/api/code-templates/search?q=${encodeURIComponent(query)}&sortBy=most_relevant`;
        const options: RequestInit = {};

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        setAvailableTemplates(data.templates || []);
      } catch (err) {
        setTemplateError(err instanceof Error ? err.message : "Failed to search templates");
        setAvailableTemplates([]);
      } finally {
        setIsSearchingTemplates(false);
      }
    }, 300),
    []
  );

  const refreshTemplates = async () => {
    setIsRefreshingTemplates(true);
    setTemplateError("");

    try {
      const url = `${domain}/api/code-templates/search?q=&sortBy=most_relevant`;
      const options: RequestInit = {};

      const response = await fetch(url, options);
      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message);
      }

      setAvailableTemplates(data.templates || []);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to refresh templates");
    } finally {
      setIsRefreshingTemplates(false);
    }
  };

  const handleTemplateChange = (template: CodeTemplate) => {
    const newSelectedTemplates = selectedTemplates.some(t => t.id === template.id)
      ? selectedTemplates.filter(t => t.id !== template.id)
      : [...selectedTemplates, template];

    onTemplateSelect(newSelectedTemplates);
  };

  const handleTemplateSearch = (term: string) => {
    setTemplateSearchTerm(term);
    if (!term.trim()) {
      refreshTemplates();
      return;
    }
    searchTemplates(term);
  };

  const handleClearSelectedTemplates = () => {
    onTemplateSelect([]);
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
      {mode === 'create' && <Typography variant="h6" className="text-blue-400 mb-4">
          Add Code Templates
      </Typography>}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <SearchBar
            onSearch={handleTemplateSearch}
            placeholder="Search templates..."
          />
        </Box>
        <Tooltip title="Refresh templates">
          <IconButton
            onClick={refreshTemplates}
            disabled={isRefreshingTemplates}
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
            <RefreshCw className={`w-5 h-5 ${isRefreshingTemplates ? 'animate-spin' : ''}`} />
          </IconButton>
        </Tooltip>
      </Box>

      {mode === 'create' && !templateSearchTerm && !isSearchingTemplates && selectedTemplates.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
            borderRadius: 2,
            border: '1px dashed',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <FileSearch className="w-12 h-12 text-blue-400 opacity-80" />
          <div>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              Search for Code Templates
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Enter keywords above to find code templates for your post
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'center',
              '& .MuiChip-root': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              }
            }}>
              <Chip
                icon={<Sparkles className="w-4 h-4" />}
                label="JavaScript"
                onClick={() => handleTemplateSearch('javascript')}
              />
              <Chip
                icon={<Sparkles className="w-4 h-4" />}
                label="React"
                onClick={() => handleTemplateSearch('react')}
              />
              <Chip
                icon={<Sparkles className="w-4 h-4" />}
                label="Python"
                onClick={() => handleTemplateSearch('python')}
              />
            </Box>
          </div>
        </Box>
      )}

      {selectedTemplates.length > 0 && (
        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          maxHeight: '100px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <Tooltip title="Clear selection">
            <IconButton
              size="small"
              onClick={handleClearSelectedTemplates}
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
            {selectedTemplates.map((template) => (
              <Chip
                key={template.id}
                label={template.title}
                onDelete={() => handleTemplateChange(template)}
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

      {templateError && (
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
            {templateError}
          </Typography>
        </Fade>
      )}

      <Paper
        elevation={0}
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          borderRadius: 2,
          bgcolor: 'background.default',
        }}
      >
        {isSearchingTemplates ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}>
            <CircularProgress size={28} />
          </Box>
        ) : availableTemplates.length === 0 ? (
          <Box sx={{
            p: 4,
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            {templateSearchTerm ? 'No templates found' : 'No templates available'}
          </Box>
        ) : (
          <Box sx={{ p: 1.5 }}>
            {availableTemplates.map((template) => (
              <Box
                key={template.id}
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
                onClick={() => handleTemplateChange(template)}
              >
                <Checkbox
                  checked={selectedTemplates.some(t => t.id === template.id)}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-checked': {
                      color: 'primary.main',
                    }
                  }}
                />
                <Box sx={{ ml: 1.5, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: selectedTemplates.some(t => t.id === template.id) ? 500 : 400,
                      color: selectedTemplates.some(t => t.id === template.id) ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {template.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {template.author.username}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Paper>
  );
};

export default SearchTemplate;