import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { java } from '@codemirror/legacy-modes/mode/clike';

const languageMap = {
  python: StreamLanguage.define(python),
  javascript: StreamLanguage.define(javascript),
  java: StreamLanguage.define(java),
};

const CodeMirrorBox = ({ label, value, onChange = null, disabled = false, language = 'plaintext' }) => {
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
          theme={vscodeDark}
          height="100%"
          extensions={[languageMap[language] || []]}
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

const InputOutputSection = ({ input, setInput, output, language }) => (
  <Box
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
      language={language}
    />
    <CodeMirrorBox
      label="Output"
      value={output}
      disabled
      language={language}
    />
  </Box>
);

export default InputOutputSection;