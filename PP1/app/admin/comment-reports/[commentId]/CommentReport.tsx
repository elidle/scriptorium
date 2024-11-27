"use client";
import {
  Typography,
  Box,
  Button,
  CircularProgress
} from "@mui/material";
import { ExternalLink, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { refreshToken, fetchAuth } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import BaseLayout from "@/app/components/BaseLayout";
import UserAvatar from "@/app/components/UserAvatar";

import { Report } from "@/app/types/report";
import { Comment } from "@/app/types/comment";

interface CommentReportParams {
  params: {
    commentId: string;
  }
}

export default function CommentReport({ params }: CommentReportParams) {
  const router = useRouter();
  const commentId = Number(params.commentId);

  const [comment, setComment] = useState<Comment | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string>("");
  
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const { user, accessToken, setAccessToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchComment();
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports(true);
    }
  }, [user]);

  const fetchComment = async () => {
    if (!user || !accessToken) return;

    try {
      let response = await fetch(`/api/comments/${commentId}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/comments/${commentId}`, {
          headers: {
            'access-token': `Bearer ${newToken}`
          }
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        return;
      }

      setComment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const fetchReports = async (reset = false) => {
    if (!user || !accessToken) return;

    const currentPage = reset ? 1 : page;
    try {
      let response = await fetch(`/api/admin/sort-reports/comment/${commentId}?page=${currentPage}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/admin/sort-reports/comment/${commentId}?page=${currentPage}`, {
          headers: {
            'access-token': `Bearer ${newToken}`
          }
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setError(`${response.status} - ${data.error}`);
        return;
      }

      reset ? setReports(data.reports) : setReports(prev => [...prev, ...data.reports]);
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleHide = async () => {
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

      router.push('/admin/comment-reports');
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
        {error ? (
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ color: 'error.main', mb: 2 }}>
              {error}
            </Typography>
            <Button
              href="/admin/comment-reports"
              variant="contained"
              color="primary"
            >
              Back to Reports
            </Button>
          </Box>
        ) : comment ? (
          <>
            {/* Comment Section */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <UserAvatar username={comment.authorUsername} userId={comment.authorId} />

                {comment.authorUsername[0] === '[' ? (
                  <Typography sx={{ color: 'text.secondary' }}>
                    {comment.authorUsername}
                  </Typography>
                ) : (
                  <Link href={`/users/${comment.authorUsername}`}>
                    <Typography 
                      sx={{
                        color: user?.id === comment.authorId ? 'success.main' : 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {comment.authorUsername}
                    </Typography>
                  </Link>
                )}

                <Typography sx={{ color: 'text.secondary' }}>
                  • {new Date(comment.createdAt).toLocaleString()}
                </Typography>
              </Box>

              <Typography sx={{ color: 'text.primary', mb: 2, whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Link href={`/blog-posts/comments/${comment.postId}`}>
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <ExternalLink size={18} />
                    <span style={{ fontSize: '0.875rem' }}>Go to post</span>
                  </Typography>
                </Link>

                <button
                  onClick={handleHide}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                      },
                    }}
                  >
                    <EyeOff size={18} />
                    <span style={{ fontSize: '0.875rem' }}>Hide</span>
                  </Typography>
                </button>
              </Box>
            </Box>

            {/* Reports Section */}
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 4 }}>
              Reports
            </Typography>

            <InfiniteScroll
              dataLength={reports.length}
              next={fetchReports}
              hasMore={hasMore}
              loader={
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              }
              endMessage={
                reports.length > 0 ? (
                  <Typography sx={{ color: 'text.secondary', textAlign: 'center', p: 2 }}>
                    End of reports
                  </Typography>
                ) : (
                  <Typography sx={{ color: 'text.secondary', textAlign: 'center', p: 2 }}>
                    No reports found
                  </Typography>
                )
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reports.map((report) => (
                  <Box
                    key={report.id}
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <UserAvatar username={report.reporterUsername} userId={report.reporterId} />
                      
                      <Link href={`/users/${report.reporterUsername}`}>
                        <Typography sx={{ 
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}>
                          {report.reporterUsername}
                        </Typography>
                      </Link>

                      <Typography sx={{ color: 'text.secondary' }}>
                        • {new Date(report.createdAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Typography sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                      {report.reason}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </InfiniteScroll>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </BaseLayout>
  );
}