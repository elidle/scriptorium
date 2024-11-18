import {
  IconButton,
} from "@mui/material";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

import { BlogPost } from "../types/blog";
import { Comment } from "../types/comment";

interface VotingProps {
  item: BlogPost | Comment;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
}

function instanceOfBlogPost(item: BlogPost | Comment): item is BlogPost {
  return 'title' in item;
}

export default function Voting({ item, handleVote }: VotingProps) {
  const { showToast } = useToast();

  return (
    <>
      <IconButton 
        className={`group ${item.userVote === 1 ? '!text-red-400' : '!text-slate-400'}`}
        onClick={async (e) => {
          e.preventDefault();
          try {
          await handleVote(item.id, true);
          } catch (err) {
          showToast({ 
            message: err instanceof Error ? err.message : 'Failed to rate post', 
            type: 'error' 
          });
        }
      }}
      disabled={!item.allowAction}
      style={{ opacity: !item.allowAction ? 0.5 : 1 }}
      >
      <ArrowUpCircle className="group-hover:!text-red-400" size={20} />
      </IconButton>
      <span className="text-sm font-medium text-slate-300">
      {item.score}
      </span>
      <IconButton 
        className={`group ${item.userVote === -1 ? '!text-blue-400' : '!text-slate-400'}`}
        onClick={async (e) => {
          e.preventDefault();
          try {
          await handleVote(item.id, false);
          } catch (err) {
          showToast({ 
            message: err instanceof Error ? err.message : `Failed to rate ${instanceOfBlogPost(item) ? 'post' : 'comment'}`, 
            type: 'error' 
          });
        }
      }}
      disabled={!item.allowAction}
      style={{ opacity: !item.allowAction ? 0.5 : 1 }}
      >
      <ArrowDownCircle className="group-hover:!text-blue-400" size={20} />
      </IconButton>
    </>
  )
}