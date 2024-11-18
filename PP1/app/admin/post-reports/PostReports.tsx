"use client";
import {
  AppBar,
  Typography,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FileText, ExternalLink, EyeOff } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from "@/app//contexts/ToastContext";
import { refreshToken } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "@/app/components/SideNav";
import UserAvatar from '@/app/components/UserAvatar';
import PostReportPreview from "./PostReportPreview";

import { ReportedPost } from "@/app/types/blog";

export default function PostReports() {
  const router = useRouter();
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user, accessToken, setAccessToken } = useAuth();
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
      let response = await fetch(`/api/admin/sort-reports/post/?page=${currentPage}`, {
        headers: {
          'access-token': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        const newToken = await refreshToken(user);
        setAccessToken(newToken);
        response = await fetch(`/api/admin/sort-reports/post/?page=${currentPage}`, {
          headers: {
            'access-token': `Bearer ${newToken}`
          }
        });
      }

      const data = await response.json();
      reset ? setReportedPosts(data.posts) : setReportedPosts(prev => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(data.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleHide = async (postId: number) => {
    // TODO: Implement post hiding functionality
    showToast({
      message: 'Post hiding functionality not implemented yet',
      type: 'info'
    });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-900">
      <SideNav router={router}/>

      <div className="flex-1 ml-64">
        <AppBar 
          position="fixed" 
          className="!bg-slate-800 border-b border-slate-700"
          sx={{ boxShadow: 'none' }}
        >
          <div className="p-3 flex items-center justify-between">
            <Link href="/">
              <Typography className="text-2xl text-blue-400" variant="h5">
                Scriptorium Admin
              </Typography>
            </Link>
            
            <div className="flex items-center gap-2">
              <UserAvatar username={user.username} userId={user.id} />
              <Typography className="text-slate-400">
                {user.username}
              </Typography>
            </div>
          </div>
        </AppBar>

        <div className="pt-16">
          <main className="flex-1 p-4 max-w-3xl mx-auto">
            <Typography variant="h6" className="text-blue-400 mb-4">
              Reported Posts
            </Typography>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                <Typography className="text-red-500">{error}</Typography>
              </div>
            )}
            
            <InfiniteScroll
              dataLength={reportedPosts.length}
              next={fetchReportedPosts}
              hasMore={hasMore}
              loader={
                <div className="text-center p-4">
                  <Typography className="text-blue-400">Loading...</Typography>
                </div>
              }
              endMessage={
                reportedPosts.length > 0 ? (
                  <Typography className="text-center p-4 text-slate-400">
                    No more reported posts
                  </Typography>
                ) : (
                  <Typography className="text-center p-4 text-slate-400">
                    No reported posts found
                  </Typography>
                )
              }
            >
              <div className="space-y-4">
                {reportedPosts.map(post => (
                  <PostReportPreview
                    key={post.id}
                    post={post}
                    handleHide={handleHide}
                  />
                ))}
              </div>
            </InfiniteScroll>
          </main>
        </div>
      </div>
    </div>
  );
}