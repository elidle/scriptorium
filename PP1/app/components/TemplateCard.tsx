import React from 'react';
import {alpha, Box, Card, CardContent, Chip, Tooltip, Typography} from "@mui/material";
import {Clock, GitBranch, GitFork} from 'lucide-react';
import {CodeTemplate} from "@/app/types";
import {useTheme} from "@/app/contexts/ThemeContext";
import Link from "next/link";
import UserAvatar from "@/app/components/UserAvatar";

interface TemplateCardProps {
  template: CodeTemplate;
}

const MAX_DESCRIPTION_LENGTH = 200;
const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const { theme, isDarkMode } = useTheme();


  const needsTruncation = template.explanation?.length > MAX_DESCRIPTION_LENGTH;

  const truncatedText = needsTruncation
    ? template.explanation.slice(0, MAX_DESCRIPTION_LENGTH) + "..."
    : template.explanation;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCount = (count: number = 0) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      python: '#3776AB',
      python3: '#3776AB',
      javascript: '#F7DF1E',
      typescript: '#3178C6',
      java: '#007396',
      ruby: '#CC342D',
      go: '#00ADD8',
      rust: '#000000',
      cpp: '#00599C',
      'c++': '#00599C',
      'c#': '#239120',
      php: '#777BB4'
    };
    return colors[language.toLowerCase()] || '#6b7280';
  };

  return (
    <Link href={`/code-templates/${template.author.username}/${template.id}`}>
      <Card
        elevation={isDarkMode ? 2 : 1}
        sx={{
          cursor: 'pointer',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          '&:hover': {
            boxShadow: isDarkMode
              ? `0 8px 24px ${alpha(theme.palette.common.black, 0.3)}`
              : `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
            borderColor: 'primary.main',
          },
          transition: 'all 0.2s ease-in-out',
        }}
        className={"w-full block"}
      >
        <CardContent>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  color: 'text.primary',
                  fontWeight: 600,
                }}
              >
                {template.title}
              </Typography>

              {/* Author Info & Language */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    '& .MuiTypography-root': {
                      color: 'primary.main',
                    },
                  },
                }}>
                  <Link className={"flex gap-2"} href={`/users/${template.author.username}`}>
                    <UserAvatar username={template.author.username} userId={template.author.id}/>
                    <Typography
                      className={"content-center"}
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        transition: 'color 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {template.author.username}
                    </Typography>
                  </Link>
                </Box>

                <Chip
                  label={template.language}
                  size="small"
                  sx={{
                    bgcolor: alpha(getLanguageColor(template.language), isDarkMode ? 0.2 : 0.1),
                    color: getLanguageColor(template.language),
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    border: 1,
                    borderColor: alpha(getLanguageColor(template.language), 0.2),
                  }}
                />
              </Box>
            </Box>

            {/* Stats & Timestamps */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Forks">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                    transition: 'color 0.2s',
                  }}>
                    <GitFork className="w-4 h-4" />
                    <Typography variant="caption">
                      {formatCount(template.forkCount)}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={`Updated: ${formatDate(template.updatedAt)}`}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                    transition: 'color 0.2s',
                  }}>
                    <Clock className="w-4 h-4" />
                    <Typography variant="caption">
                      {formatDate(template.createdAt)}
                    </Typography>
                  </Box>
                </Tooltip>

                {template.isForked && (
                  <Tooltip title="Forked template">
                    <Chip
                      icon={<GitBranch className="w-3 h-3" />}
                      label="Forked"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        border: 1,
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>

          {/* Content Section */}
          <Box className="mb-3">
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                color: 'text.secondary',
                lineHeight: 1.6,
              }}
            >
              {truncatedText}
            </Typography>
          </Box>

          {/* Code Preview */}
          <Box
            sx={{
              bgcolor: isDarkMode
                ? alpha(theme.palette.common.black, 0.3)
                : alpha(theme.palette.common.black, 0.05),
              p: 2,
              borderRadius: 1,
              mb: 2,
              maxHeight: '100px',
              overflow: 'hidden',
              position: 'relative',
              border: 1,
              borderColor: 'divider',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: `linear-gradient(transparent, ${theme.palette.background.paper})`,
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'text.primary',
              }}
            >
              {template.code}
            </Typography>
          </Box>

          {/* Tags Section */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {template.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag.name}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  border: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
};
export default TemplateCard;