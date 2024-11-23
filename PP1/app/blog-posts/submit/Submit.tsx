"use client";
import {
  AppBar,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import {useState, useEffect, useCallback} from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "../../contexts/AuthContext";
import { fetchAuth } from "../../utils/auth";
import SideNav from "../../components/SideNav";
import SearchTemplate from "@/app/components/SearchTemplate";
import {CodeTemplate, Tag} from "@/app/types";
import UserAvatar from "@/app/components/UserAvatar";
import TagsContainer from "@/app/components/TagsContainer";



export default function Submit() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Code templates related state
  const [selectedTemplates, setSelectedTemplates] = useState<CodeTemplate[]>([]);

  // Tags related state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const { accessToken, setAccessToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !accessToken)) {
      router.push('/auth/login');
    }
  }, [user, router, loading]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user || !accessToken) return;

      setIsLoadingTags(true);
      try {
        const url = 'http://localhost:3000/api/tags/search/?q=';
        const options: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            'access-token': `Bearer ${accessToken}`,
          },
        };

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        setAvailableTags(data.tags || []);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, [user, accessToken]);

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

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
          tags: selectedTags,
          codeTemplateIds: selectedTemplates.map(t => t.id)
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
          {user ? (
          <div className="flex items-center gap-2">
            <UserAvatar username={user.username} userId={user.id} />

            <Typography className="text-slate-200">
              {user.username}
            </Typography>
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

          <div className="space-y-6">
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
            <SearchTemplate
              selectedTemplates={selectedTemplates}
              onTemplateSelect={setSelectedTemplates}
              mode = "create"
            />
            <TagsContainer
              tags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={handleTagsChange}
              mode="create"
            />

            <form onSubmit={handleSubmit}>
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
          </div>
      </main>
    </div>
);
}