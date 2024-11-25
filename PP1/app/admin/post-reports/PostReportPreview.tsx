import {
  Typography,
} from "@mui/material";
import { FileText, ExternalLink, EyeOff } from "lucide-react";
import Link from 'next/link';

import UserAvatar from '@/app/components/UserAvatar';

import { ReportedPost } from "@/app/types/post";

import { useAuth } from "@/app/contexts/AuthContext";

interface PostReportPreviewProps {
  post: ReportedPost;
  handleHide: (postId: number) => void;
}

export default function PostReportPreview( { post, handleHide }: PostReportPreviewProps ) {
  const { user } = useAuth();

  return (
    <article 
      key={post.id} 
      className="bg-slate-800 rounded-lg border border-slate-700 p-4"
    >
      <div className="flex items-center gap-2 mb-4">
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

        <Typography className="text-red-400 ml-auto">
          {post.reportCount} reports
        </Typography>
      </div>

      <Typography variant="h6" className="text-slate-200 mb-2">
        {post.title}
      </Typography>
      <Typography className="text-slate-300 mb-4 line-clamp-3">
        {post.content}
      </Typography>

      <div className="flex mt-2 gap-4">
        <Link 
          href={`/admin/post-reports/${post.id}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
        >
          <FileText size={18} />
          <span className="text-sm">See reports</span>
        </Link>
        <Link 
          href={`/blog-posts/comments/${post.id}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
        >
          <ExternalLink size={18} />
          <span className="text-sm">Go to post</span>
        </Link>
        <button 
          onClick={() => handleHide(post.id)}
          className="flex items-center gap-1 text-slate-400 hover:text-red-400"
        >
          <EyeOff size={18} />
          <span className="text-sm">Hide</span>
        </button>
      </div>
    </article>
  );
}