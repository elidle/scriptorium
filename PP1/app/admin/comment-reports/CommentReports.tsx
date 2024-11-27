"use client";
import {
  Typography,
  CircularProgress,
  Box
} from "@mui/material";
import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from "@/app//contexts/ToastContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useRouter } from "next/navigation";

import BaseLayout from "@/app/components/BaseLayout";
import CommentReportPreview from "./CommentReportPreview";

import { ReportedComment } from "@/app/types/comment";
import { fetchAuth, refreshToken } from "@/app/utils/auth";

export default function CommentReports() {
  const router = useRouter();
  const { theme } = useTheme();
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user, accessToken, setAccessToken, loading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (!loading) fetchReportedComments(true);
  }, [user]);

  const fetchReportedComments = async (reset = false) => {
    if (!user || !accessToken) return;

    const currentPage = reset ? 1 : page;
    try {
      let response = await fetch(`/api/admin/sort-reports/comment/?page=${currentPage}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/admin/sort-reports/comment/?page=${currentPage}`, {
          headers: {
            'access-token': `Bearer ${newToken}`
          }
        });
      }

      const data = await response.json();
      (reset ? setReportedComments(data.comments) : setReportedComments(prev => [...prev, ...data.comments]));
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleHide = async (commentId: number) => {
    if (!user || !accessToken) return;

    try {
      const url = `/api/admin/hide/comment`;
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          commentId: commentId
        }),
      };

      const response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to hide comment`);
      }

      showToast({ 
        message: `Comment ${commentId} hidden successfully`, 
        type: 'success' 
      });

      fetchReportedComments(true);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : `Failed to hide comment`, 
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
          Reported Comments
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
          dataLength={reportedComments.length}
          next={fetchReportedComments}
          hasMore={hasMore}
          loader={
            <div className="text-center p-4">
              <CircularProgress />
            </div>
          }
          endMessage={
            reportedComments.length > 0 ? (
              <Typography sx={{ color: theme.palette.text.secondary }} className="text-center p-4">
                No more reported comments
              </Typography>
            ) : (
              <Typography sx={{ color: theme.palette.primary.main }} className="text-center p-4">
                No reported comments found
              </Typography>
            )
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reportedComments.map(comment => (
              <CommentReportPreview
                key={comment.id}
                comment={comment}
                handleHide={handleHide}
              />
            ))}
          </Box>
        </InfiniteScroll>
      </Box>
    </BaseLayout>
  );
}