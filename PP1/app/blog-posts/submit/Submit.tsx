"use client";
import {
  Typography,
  TextField,
  Button,
} from "@mui/material";
import {useState, useEffect} from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "../../contexts/AuthContext";
import { fetchAuth } from "../../utils/auth";
import SearchTemplate from "@/app/components/SearchTemplate";
import {CodeTemplate, Tag} from "@/app/types";
import BaseLayout from "@/app/components/BaseLayout";
import TagsContainer from "@/app/components/TagsContainer";
import { useTheme } from "@/app/contexts/ThemeContext";

const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Submit() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<CodeTemplate[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { accessToken, setAccessToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !accessToken)) {
      router.push('/auth/login');
    }
  }, [user, router, loading]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user || !accessToken) return;

      try {
        const url = `${domain}/api/tags/search/?q=`;
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
          authorId: user?.id,
          title: title.trim(),
          content: content,
          tags: selectedTags,
          codeTemplateIds: selectedTemplates.map(t => t.id)
        }),
      };

      const response = await fetchAuth({url, options, user: user!, setAccessToken, router});
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/blog-posts/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/blog-posts/search');
    }
  };

  return (
    <BaseLayout
      user={user}
      onSearch={handleSearch}
      type="post"
    >
      <main className="flex-1 px-4 pt-12 pb-8" style={{ maxWidth: '75rem', margin: '0 auto' }}>
        <div style={{
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          borderRadius: '0.5rem',
          padding: '1.5rem'
        }}>
          <Typography variant="h4" className="text-blue-400 mb-6">
            Create a Post
          </Typography>

          {error && (
            <div className={`${
              isDarkMode 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-red-50 border-red-200'
            } rounded-lg border p-4 mb-6`}>
              <Typography className="text-red-500">{error}</Typography>
            </div>
          )}

          <div className="space-y-6 mt-4">
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.background.default,
                  '&:hover': {
                    backgroundColor: theme.palette.background.default,
                  },
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
                '& input': {
                  color: theme.palette.text.primary,
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
                  backgroundColor: theme.palette.background.default,
                  '&:hover': {
                    backgroundColor: theme.palette.background.default,
                  },
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
                '& textarea': {
                  color: theme.palette.text.primary,
                  whiteSpace: 'pre-wrap',
                },
              }}
            />

            <SearchTemplate
              selectedTemplates={selectedTemplates}
              onTemplateSelect={setSelectedTemplates}
              mode="create"
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
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                >
                  {isLoading ? 'Submitting...' : 'Submit Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </BaseLayout>
  );
}