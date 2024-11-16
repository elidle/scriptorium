"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Chip,
} from "@mui/material";
import { useState } from "react";
import Link from 'next/link';

const availableTags = [
  "javascript",
  "programming",
  "web development",
  "react",
  "nextjs",
  "typescript"
];

export default function Submit() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    // TODO: Connect to backend API
    alert(`Post submitted with title: ${title}, content: ${content}, tags: ${selectedTags.join(", ")}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        className="bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/">
            <Typography 
              className="text-xl sm:text-2xl text-blue-400 flex-shrink-0 cursor-pointer" 
              variant="h5"
            >
              Scriptorium
            </Typography>
          </Link>
          <div className="flex-grow" />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
            variant="contained"
            size="small"
          >
            Sign In
          </Button>
        </div>
      </AppBar>

      {/* Main Content */}
      <main className="container mx-auto max-w-3xl px-4 pt-24 pb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <Typography variant="h4" className="text-blue-400 mb-6">
            Create a Post
          </Typography>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{error}</Typography>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                  '&:hover': {
                    backgroundColor: 'rgb(30, 41, 59, 0.8)',
                  },
                  '& fieldset': {
                    borderColor: 'rgb(100, 116, 139)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(148, 163, 184)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
                '& input': {
                  color: 'rgb(226, 232, 240)',
                },
              }}
            />

            <TextField
              label="Content"
              variant="outlined"
              fullWidth
              multiline
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                  '&:hover': {
                    backgroundColor: 'rgb(30, 41, 59, 0.8)',
                  },
                  '& fieldset': {
                    borderColor: 'rgb(100, 116, 139)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(148, 163, 184)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
                '& textarea': {
                  color: 'rgb(226, 232, 240)',
                },
              }}
            />

            <Autocomplete
              multiple
              options={availableTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  variant="outlined"
                  placeholder="Select tags"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgb(30, 41, 59)',
                      '&:hover': {
                        backgroundColor: 'rgb(30, 41, 59, 0.8)',
                      },
                      '& fieldset': {
                        borderColor: 'rgb(100, 116, 139)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgb(148, 163, 184)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgb(148, 163, 184)',
                    },
                    '& input': {
                      color: 'rgb(226, 232, 240)',
                    },
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    className="bg-blue-600 text-white"
                  />
                ))
              }
            />

            <div className="flex justify-end gap-4">
              <Link href="/blog-posts/search">
                <Button 
                  variant="outlined"
                  className="text-slate-300 border-slate-700 hover:border-blue-400"
                >
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit"
                variant="contained"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit Post
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}