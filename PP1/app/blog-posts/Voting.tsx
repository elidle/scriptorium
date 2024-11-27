import { IconButton, Typography, ThemeProvider } from "@mui/material";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";

import { Post } from "../types/post";
import { Comment } from "../types/comment";
interface VotingProps {
  item: Post | Comment;
  handleVote: (id: number, isUpvote: boolean) => Promise<void>;
}
function instanceOfBlogPost(item: Post | Comment): item is Post {
  return 'title' in item;
}

export default function Voting({ item, handleVote }: VotingProps) {
  const { showToast } = useToast();
  const { theme } = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <>
        <IconButton
          sx={{
            color: item.userVote === 1 ? 'error.main' : 'text.secondary',
            opacity: !item.allowAction ? 0.5 : 1,
            '&:hover': {
              '& svg': {
                color: 'error.main',
              },
            },
          }}
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
        >
          <ArrowUpCircle size={20} />
        </IconButton>

        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {item.score}
        </Typography>

        <IconButton
          sx={{
            color: item.userVote === -1 ? 'primary.main' : 'text.secondary',
            opacity: !item.allowAction ? 0.5 : 1,
            '&:hover': {
              '& svg': {
                color: 'primary.main',
              },
            },
          }}
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
        >
          <ArrowDownCircle size={20} />
        </IconButton>
      </>
    </ThemeProvider>
  );
}