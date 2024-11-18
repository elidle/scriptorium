"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "../../contexts/AuthContext";
import { fetchAuth } from "../../utils/auth";
import SideNav from "../../components/SideNav";

export default function Submit() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { accessToken, setAccessToken, user } = useAuth();

  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      setIsLoading(false);
      return;
    }
   
    try {
      const url = '/api/blog-posts';
      const options : RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          authorId: user.id,
          title: title.trim(),
          content: content,
          tags: [],
          codeTemplateIds: []
        }),
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;
   
      const data = await response.json();
   
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
   
      router.push(`/blog-posts/comments/${data.id}`);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
   };

  return (
    <div className="min-h-screen flex bg-slate-900">
      <SideNav router={router} />

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
          <Link href="/auth/login">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
              variant="contained"
              size="small"
            >
              Log In
            </Button>
          </Link>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                  whiteSpace: 'pre-wrap',
                },
              }}
            />

            <div className="flex justify-end gap-4">
              <Link href="/blog-posts/search">
                <Button 
                  variant="outlined"
                  disabled={isLoading}
                  className="text-slate-300 border-slate-700 hover:border-blue-400"
                >
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit"
                variant="contained"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Submitting...' : 'Submit Post'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}