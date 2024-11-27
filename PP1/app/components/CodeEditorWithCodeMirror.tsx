import React, {useCallback} from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
const CodeMirror = ReactCodeMirror;
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { java } from '@codemirror/legacy-modes/mode/clike';
import { Box, Typography } from '@mui/material';
import {useTheme} from "@/app/contexts/ThemeContext";
import {githubDark, githubLight} from "@uiw/codemirror-theme-github";

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
  onChange: (code: string) => void;
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
  const { theme, isDarkMode } = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: minHeight,
          height: 'auto',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          '& .cm-editor': {
            height: '100%',
            minHeight: minHeight,
            maxWidth: '100%',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',

            '& .cm-scroller': {
              minHeight: minHeight,
              overflow: 'auto',
              lineHeight: '1.6',
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.palette.grey[600]} transparent`,

              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.grey[600],
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.grey[500],
                },
              },
              overflowX: 'auto',
              whiteSpace: 'pre',
            },

            '& .cm-content': {
              minHeight: minHeight,
              padding: '8px 0',
              whiteSpace: 'pre',
              overflow: 'auto',
              width: 'max-content',
              maxWidth: 'none',
            },

            '& .cm-gutters': {
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.secondary,
              minHeight: minHeight,
              position: 'sticky',
              left: 0,
              zIndex: 1,
            },

            '& .cm-lineNumbers': {
              position: 'sticky',
              left: 0,
              backgroundColor: theme.palette.background.paper,
            },

            '& .cm-activeLine': {
              backgroundColor: `${theme.palette.primary.main}1A !important`, // 1A = 10% opacity in hex
            },

            '& .cm-selectionBackground': {
              backgroundColor: `${theme.palette.primary.main}33 !important`, // 33 = 20% opacity in hex
            },

            '& .cm-matchingBracket': {
              backgroundColor: `${theme.palette.primary.main}4D`, // 4D = 30% opacity in hex
              color: 'inherit',
            },

            '& .cm-placeholder': {
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
            },
          },
        }}
      >
        <CodeMirror
          value={code || ''}
          onChange={onChange}
          theme={isDarkMode ? githubDark : githubLight}
          height="100%"
          minHeight={minHeight}
          width='100%'
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
