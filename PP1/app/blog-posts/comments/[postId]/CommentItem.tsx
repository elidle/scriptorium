"use client";
import {
  Typography,
  IconButton,
  Avatar,
  Button,
  Collapse,
  TextField,
} from "@mui/material";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  MessageCircle,
  TriangleAlert,
  ChevronUp
} from "lucide-react";
import { useState } from "react";

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  createdAt: string;
  score: number;
  replies: Comment[];
  allowVoting: boolean;
  userVote: number;
}

interface CommentItemProps {
  comment: Comment;
  handleVote: (increment: boolean, commentId: number | null) => void;
  handleReportClick: (commentId: number | null) => void;
}

export default function CommentItem({ comment, handleVote, handleReportClick }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      alert("Reply cannot be empty");
      return;
    }
    alert(`Reply successfully submitted with content ${replyContent}`);
    setReplyContent('');
    setIsReplying(false);
    // TODO: Connect to actual API endpoint
  };

  return (
    <div className="ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
      {/* Header with voting and user info */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}>
          {comment.authorUsername[0].toUpperCase()}
        </Avatar>
        <Typography className="text-sm text-slate-400">
          {comment.authorUsername} • {new Date(comment.createdAt).toLocaleString()}
        </Typography>

        <IconButton 
          className={`hover:text-red-400 ${comment.userVote === 1 ? 'text-red-400' : 'text-slate-400'}`} 
          onClick={() => handleVote(true, comment.id)}
          disabled={!comment.allowVoting}
          sx={{ opacity: !comment.allowVoting ? 0.5 : 1 }}
        >
          <ArrowUpCircle size={20} />
        </IconButton>
        <span className="text-sm font-medium text-slate-300">{comment.score}</span>
        <IconButton 
          className={`hover:text-blue-400 ${comment.userVote === -1 ? 'text-blue-400' : 'text-slate-400'}`} 
          onClick={() => handleVote(false, comment.id)}
          disabled={!comment.allowVoting}
          sx={{ opacity: !comment.allowVoting ? 0.5 : 1 }}
        >
          <ArrowDownCircle size={20} />
        </IconButton>
      </div>

      {/* Comment content */}
      <Typography className="text-slate-300 mb-2 ml-10">{comment.content}</Typography>

      {/* Action buttons */}
      <div className="flex items-center gap-4 ml-10 mb-2">
        {comment.replies.length > 0 && (
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-400"
          >
            <ChevronUp
              size={16}
              className={`transition-transform duration-300 ${
                isCollapsed ? "rotate-0" : "rotate-180"
              }`}
            />
            <span className="text-xs">
              {isCollapsed ? "Show Replies" : "Hide Replies"}
            </span>
          </button>
        )}
        <button onClick={() => setIsReplying(true)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
          <MessageCircle size={16} />
          <span className="text-xs">Reply</span>
        </button>
        <button onClick={() => handleReportClick(comment.id)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400">
          <TriangleAlert size={16} />
          <span className="text-xs">Report</span>
        </button>
      </div>

      {/* Reply input field */}
      {isReplying && (
        <div className="ml-10 mb-4">
          <form 
            onSubmit={handleReplySubmit} 
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleReplySubmit(e);
              } else if (e.key === 'Escape') {
                setIsReplying(false);
                setReplyContent('');
              }
            }}
          >
          <TextField
            fullWidth
            multiline
            rows={2}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="bg-slate-900"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgb(226, 232, 240)',
                '& fieldset': {
                  borderColor: 'rgb(51, 65, 85)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgb(59, 130, 246)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgb(59, 130, 246)',
                },
              },
            }}
          />
          <div className="flex gap-2">
            <Button 
              type="submit"
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700"
            >
            Submit
            </Button>
            <Button 
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              variant="outlined"
              className="text-slate-300 border-slate-700 hover:border-blue-400"
            >
            Cancel
            </Button>
            </div>
          </form>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <Collapse in={!isCollapsed} timeout="auto">
          <div className="pl-4">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id}
                comment={reply} 
                handleVote={handleVote}
                handleReportClick={handleReportClick}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}