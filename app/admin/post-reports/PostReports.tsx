"use client";
import {
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from "@/app/contexts/ToastContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useRouter } from "next/navigation";

import BaseLayout from "@/app/components/BaseLayout";
import PostReportPreview from "./PostReportPreview";

import { ReportedPost } from "@/app/types/post";

export default function PostReports() {
  const router = useRouter();
  const { theme } = useTheme();
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user, accessToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchReportedPosts(true);
  }, [user]);

  const fetchReportedPosts = async (reset = false) => {
    if (!user || !accessToken) return;

    const currentPage = reset ? 1 : page;
    try {
      const response = await fetch(`/api/admin/sort-reports/post/?page=${currentPage}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      if (reset) {
        setReportedPosts(data.posts);
       } else {
        setReportedPosts(prev => [...prev, ...data.posts]);
       }
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleHide = async (postId: number) => {
    if (!user || !accessToken) return;

    try {
      const response = await fetch('/api/admin/hide/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          postId: postId
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to hide post`);
      }

      showToast({ 
        message: `Post ${postId} hidden successfully`, 
        type: 'success' 
      });

      fetchReportedPosts(true);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : `Failed to hide post`, 
        type: 'error' 
      });
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/blog-posts/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/blog-posts/search');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <BaseLayout
      user={user}
      onSearch={handleSearch}
      type="post"
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          maxWidth: '75rem',
          mx: 'auto'
        }}
      >
        <Typography variant="h4" sx={{ color: theme.palette.primary.main, mb: '1rem' }}>
          Reported Posts
        </Typography>

        {error && (
          <div style={{
            backgroundColor: theme.palette.error.main + '1A',
            borderColor: theme.palette.error.main,
            borderWidth: 1,
            borderRadius: '0.5rem',
          }} className="p-4 mb-4">
            <Typography sx={{ color: theme.palette.error.main }}>{error}</Typography>
          </div>
        )}
        
        <InfiniteScroll
          dataLength={reportedPosts.length}
          next={fetchReportedPosts}
          hasMore={hasMore}
          loader={
            <div className="text-center p-4">
              <CircularProgress />
            </div>
          }
          endMessage={
            reportedPosts.length > 0 ? (
              <Typography sx={{ color: theme.palette.text.secondary }} className="text-center p-4">
                No more reported posts
              </Typography>
            ) : (
              <Typography sx={{ color: theme.palette.primary.main }} className="text-center p-4">
                No reported posts found
              </Typography>
            )
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reportedPosts.map(post => (
              <PostReportPreview
                key={post.id}
                post={post}
                handleHide={handleHide}
              />
            ))}
          </Box>
        </InfiniteScroll>
      </Box>
    </BaseLayout>
  );
}