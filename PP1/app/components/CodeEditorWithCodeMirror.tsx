import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { java } from '@codemirror/legacy-modes/mode/clike';
import { Paper, Typography, Box } from '@mui/material';

const languageMap = {
  python: StreamLanguage.define(python),
  javascript: StreamLanguage.define(javascript),
  java: StreamLanguage.define(java),
};

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CodeEditorWithCodeMirror: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  disabled = false
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          width: '100%',
          height: '500px', // Adjust height as needed
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid rgb(100, 116, 139)',
          '& .cm-editor': {
            // Editor container
            height: '100%',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',

            // Line numbers
            '& .cm-gutters': {
              backgroundColor: 'rgb(30, 41, 59)',
              borderRight: '1px solid rgb(51, 65, 85)',
              color: 'rgb(148, 163, 184)',
            },

            // Active line highlight
            '& .cm-activeLine': {
              backgroundColor: 'rgba(37, 99, 235, 0.1) !important',
            },

            // Selection
            '& .cm-selectionBackground': {
              backgroundColor: 'rgba(37, 99, 235, 0.2) !important',
            },

            // Matching brackets
            '& .cm-matchingBracket': {
              backgroundColor: 'rgba(37, 99, 235, 0.3)',
              color: 'inherit',
            },

            // Scrollbar styling
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
          value={code}
          onChange={onChange}
          theme={vscodeDark}
          height="100%"
          extensions={[languageMap[language.toLowerCase()] || []]}
          editable={!disabled}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightSelectionMatches: true,
          }}
        />
      </Box>
    </Box>
  );
};

export default CodeEditorWithCodeMirror;