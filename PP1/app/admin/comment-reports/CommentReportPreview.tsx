import {
  Typography,
} from "@mui/material";
import { FileText, ExternalLink, EyeOff } from "lucide-react";
import Link from 'next/link';
import UserAvatar from '@/app/components/UserAvatar';

import { ReportedComment } from "@/app/types/comment";

interface CommentReportPreviewProps {
  comment: ReportedComment;
  handleHide: (postId: number) => void;
}

export default function PostReportPreview( { comment, handleHide }: CommentReportPreviewProps ) {
  return (
    <article 
      key={comment.id} 
      className="bg-slate-800 rounded-lg border border-slate-700 p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <UserAvatar username={comment.authorUsername} userId={comment.authorId} />

        {
          comment.authorUsername[0] === '[' ? (
            <Typography className="text-slate-400">
              {comment.authorUsername}
            </Typography>
          ) : (
            <Link href={`/users/${comment.authorUsername}`}>
              <Typography className={`hover:text-blue-400 ${comment?.id === comment.authorId ? 'text-green-400' : 'text-slate-400'}`}>
                {comment.authorUsername}
              </Typography>
            </Link>
          )
        }

        <Typography className="text-slate-400">
          • {new Date(comment.createdAt).toLocaleString()}
        </Typography>
        <Typography className="text-red-400 ml-auto">
          {comment.reportCount} reports
        </Typography>
      </div>

      <Typography className="text-slate-300 mb-4 line-clamp-3">
        {comment.content}
      </Typography>

      <div className="flex mt-2 gap-4">
        <Link 
          href={`/admin/comment-reports/${comment.id}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
        >
          <FileText size={18} />
          <span className="text-sm">See reports</span>
        </Link>
        <Link 
          href={`/blog-posts/comments/${comment.postId}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
        >
          <ExternalLink size={18} />
          <span className="text-sm">Go to post</span>
        </Link>
        <button 
          onClick={() => handleHide(comment.id)}
          className="flex items-center gap-1 text-slate-400 hover:text-red-400"
        >
          <EyeOff size={18} />
          <span className="text-sm">Hide</span>
        </button>
      </div>
    </article>
  );
}