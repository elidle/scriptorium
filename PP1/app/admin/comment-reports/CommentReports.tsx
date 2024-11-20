"use client";
import {
  AppBar,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from "@/app//contexts/ToastContext";
import { refreshToken } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

import SideNav from "@/app/components/SideNav";
import UserAvatar from '@/app/components/UserAvatar';
import CommentReportPreview from "./CommentReportPreview";

import { ReportedComment } from "@/app/types/comment";
import { fetchAuth } from "@/app/utils/auth";

export default function CommentReports() {
  const router = useRouter();
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
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
    fetchReportedComments(true);
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
      reset ? setReportedComments(data.comments) : setReportedComments(prev => [...prev, ...data.comments]);
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

      let response = await fetchAuth({url, options, user, setAccessToken, router});
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
              Reported Comments
            </Typography>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                <Typography className="text-red-500">{error}</Typography>
              </div>
            )}
            
            <InfiniteScroll
              dataLength={reportedComments.length}
              next={fetchReportedComments}
              hasMore={hasMore}
              loader={
                <div className="text-center p-4">
                  <Typography className="text-blue-400">Loading...</Typography>
                </div>
              }
              endMessage={
                reportedComments.length > 0 ? (
                  <Typography className="text-center p-4 text-slate-400">
                    No more reported comments
                  </Typography>
                ) : (
                  <Typography className="text-center p-4 text-slate-400">
                    No reported comments found
                  </Typography>
                )
              }
            >
              <div className="space-y-4">
                {reportedComments.map(comment => (
                  <CommentReportPreview
                    key={comment.id}
                    comment={comment}
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