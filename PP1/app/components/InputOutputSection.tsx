import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "@/app/contexts/ThemeContext";


const CodeMirrorBox = ({ label, value, onChange = null, disabled = false, isDarkMode = true }) => {
  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        width: '100%',
        height: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 'calc(300px - 80px)',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid rgb(100, 116, 139)',
          '& .cm-editor': {
            height: '100%',
            // Custom scrollbar styling
            '& .cm-scroller': {
              scrollbarWidth: 'thin',
              scrollbarColor: '#4b5563 transparent',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#4b5563',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#6b7280',
                },
              },
            },
          },
        }}
      >
        <CodeMirror
          value={value || ''}
          onChange={onChange}
          theme={isDarkMode ? githubDark : githubLight}
          height="100%"
          extensions={[]}
          editable={!disabled}
          basicSetup={{
            lineNumbers: !disabled,
            foldGutter: !disabled,
            highlightActiveLine: !disabled,
            dropCursor: !disabled,
            allowMultipleSelections: !disabled,
            indentOnInput: !disabled,
            bracketMatching: !disabled,
          }}
          style={{ height: '100%' }}
        />
      </Box>
    </Paper>
  );
};

const InputOutputSection = ({ input, setInput, output}) => {
  const { theme, isDarkMode } = useTheme();
  return (<Box
    display="grid"
    gridTemplateColumns="1fr 1fr"
    gap={3}
    sx={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
    }}
  >
    <CodeMirrorBox
      label="Input"
      value={input}
      onChange={setInput}
      isDarkMode={isDarkMode}
    />
    <CodeMirrorBox
      label="Output"
      value={output}
      disabled
      isDarkMode={isDarkMode}
    />
  </Box>);
};

export default InputOutputSection;