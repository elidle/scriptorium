import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { java } from '@codemirror/legacy-modes/mode/clike';
import { Box, Typography } from '@mui/material';

const languageMap = {
  python: StreamLanguage.define(python),
  javascript: StreamLanguage.define(javascript),
  java: StreamLanguage.define(java),
};

const getLanguageExtension = (language: string = 'python') => {
  const lang = language?.toLowerCase() || 'python';
  return languageMap[lang] || languageMap.python;
};

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: string;
  placeholder?: string;
}

export const CodeEditorWithCodeMirror: React.FC<CodeEditorProps> = ({
  code = '',
  language = 'python',
  onChange,
  disabled = false,
  minHeight = '400px',
  placeholder = '// Start typing your code here...'
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: minHeight,
          height: 'auto',
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid rgb(100, 116, 139)',
          '& .cm-editor': {
            height: '100%',
            minHeight: minHeight,
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',

            // Make sure editor fills the container
            '& .cm-scroller': {
              minHeight: minHeight,
              overflow: 'auto',
              lineHeight: '1.6',
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

            '& .cm-gutters': {
              backgroundColor: 'rgb(30, 41, 59)',
              borderRight: '1px solid rgb(51, 65, 85)',
              color: 'rgb(148, 163, 184)',
              minHeight: minHeight,
            },

            '& .cm-content': {
              minHeight: minHeight,
              padding: '8px 0',
            },

            '& .cm-activeLine': {
              backgroundColor: 'rgba(37, 99, 235, 0.1) !important',
            },

            '& .cm-selectionBackground': {
              backgroundColor: 'rgba(37, 99, 235, 0.2) !important',
            },

            '& .cm-matchingBracket': {
              backgroundColor: 'rgba(37, 99, 235, 0.3)',
              color: 'inherit',
            },

            // Placeholder styling
            '& .cm-placeholder': {
              color: 'rgb(148, 163, 184)',
              fontStyle: 'italic',
            },
          },
        }}
      >
        <CodeMirror
          value={code || ''}
          onChange={onChange}
          theme={vscodeDark}
          height="100%"
          minHeight={minHeight}
          extensions={[getLanguageExtension(language)]}
          editable={!disabled}
          placeholder={placeholder}
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
            tabSize: 4,
            indentUnit: 4,
          }}
        />
      </Box>
    </Box>
  );
};

export default CodeEditorWithCodeMirror;