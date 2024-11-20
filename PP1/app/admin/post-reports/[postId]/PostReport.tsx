"use client";
import {
  Typography,
  AppBar,
  Button
} from "@mui/material";
import { ExternalLink, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";

import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { fetchAuth, refreshToken } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "@/app/components/SideNav";
import UserAvatar from "@/app/components/UserAvatar";

import { Report } from "@/app/types/report";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
}

interface PostReportParams {
  params: {
    postId: string;
  }
}

export default function PostReport({ params }: PostReportParams) {
  const router = useRouter();
  const postId = Number(params.postId);

  const [post, setPost] = useState<BlogPost | null>(null);
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
    fetchPost();
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports(true);
    }
  }, [user]);

  const fetchPost = async () => {
    if (!user || !accessToken) return;

    try {
      let response = await fetch(`/api/blog-posts/${postId}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/blog-posts/${postId}`, {
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

      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const fetchReports = async (reset = false) => {
    if (!user || !accessToken) return;

    const currentPage = reset ? 1 : page;
    try {
      let response = await fetch(`/api/admin/sort-reports/post/${postId}?page=${currentPage}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/admin/sort-reports/post/${postId}?page=${currentPage}`, {
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
      const url = `/api/admin/hide/post`;
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          postId: postId
        }),
      };

      let response = await fetchAuth({url, options, user, setAccessToken, router});
      if (!response) return;

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to hide post`);
      }

      showToast({ 
        message: `Post ${postId} hidden successfully`, 
        type: 'success' 
      });

      router.push('/admin/post-reports');
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : `Failed to hide post`, 
        type: 'error' 
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-200">
      <SideNav router={router} />

      <AppBar 
        position="fixed" 
        className="!bg-slate-800 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/">
            <Typography 
              className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
              variant="h5"
            >
              Scriptorium Admin
            </Typography>
          </Link>

          <div className="flex-grow"></div>

          <div className="flex items-center gap-2">
            <UserAvatar username={user.username} userId={user.id} />
            <Typography className="text-slate-200">
              {user.username}
            </Typography>
          </div>
        </div>
      </AppBar>

      <main className="flex-1 p-4 max-w-3xl w-full mx-auto mt-12 mb-10">
        {error ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <Typography variant="h5" className="text-red-400 mb-4">
              {error}
            </Typography>
            <Button 
              href="/admin/post-reports"
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Reports
            </Button>
          </div>
        ) : post ? (
          <>
            {/* Post Section */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <UserAvatar username={post.authorUsername} userId={post.authorId} />

                {
                  post.authorUsername[0] === '[' ? (
                    <Typography className="text-slate-400">
                      {post.authorUsername}
                    </Typography>
                  ) : (
                    <Link href={`/users/${post.authorUsername}`}>
                      <Typography className={`hover:text-blue-400 ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
                        {post.authorUsername}
                      </Typography>
                    </Link>
                  )
                }

                <Typography className="text-slate-400">
                  • {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </div>

              <Typography variant="h4" className="text-slate-300">
                {post.title === null ? "[Deleted post]" : post.title}
              </Typography>

              <Typography variant="body1" className="text-slate-300 mb-2 mt-2" sx={{ whiteSpace: "pre-wrap" }}>
                {post.content}
              </Typography>

              <div className="flex gap-4 mt-2">
                <Link 
                  href={`/blog-posts/comments/${post.id}`}
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
                >
                  <ExternalLink size={18} />
                  <span className="text-sm">Go to post</span>
                </Link>
                <button 
                  onClick={handleHide}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-400"
                >
                  <EyeOff size={18} />
                  <span className="text-sm">Hide</span>
                </button>
              </div>
            </div>

            {/* Reports Section */}
            <Typography variant="h6" className="text-blue-400 mb-4">
              Reports
            </Typography>

            <InfiniteScroll
              dataLength={reports.length}
              next={fetchReports}
              hasMore={hasMore}
              loader={<Typography className="text-blue-400">Loading reports...</Typography>}
              endMessage={
                reports.length > 0 ? (
                  <Typography className="text-slate-400">End of reports</Typography>
                ) : (
                  <Typography className="text-slate-400">No reports found</Typography>
                )
              }
            >
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    className="bg-slate-800 rounded-lg border border-slate-700 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar username={report.reporterUsername} userId={report.reporterId} />

                      {
                        post.authorUsername[0] === '[' ? (
                          <Typography className="text-slate-400">
                            {post.authorUsername}
                          </Typography>
                        ) : (
                          <Link href={`/users/${post.authorUsername}`}>
                            <Typography className={`hover:text-blue-400 ${user?.id === post.authorId ? 'text-green-400' : 'text-slate-400'}`}>
                              {post.authorUsername}
                            </Typography>
                          </Link>
                        )
                      }

                      <Typography className="text-slate-400">
                        • {new Date(report.createdAt).toLocaleString()}
                      </Typography>
                    </div>
                    <Typography className="text-slate-300 whitespace-pre-wrap">
                      {report.reason}
                    </Typography>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </>
        ) : (
          <div className="flex justify-center items-center">
            <Typography className="text-blue-400">Loading post...</Typography>
          </div>
        )}
      </main>
    </div>
  );
}