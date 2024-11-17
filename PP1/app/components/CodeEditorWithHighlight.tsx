import React, { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript';
import java from 'react-syntax-highlighter/dist/cjs/languages/hljs/java';
import {
  TextField,
  Paper,
  Typography,
  Box,
} from '@mui/material';

// Register the languages
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('java', java);

const formatCode = (code: string, maxLineLength: number = 80): string => {
  if (!code) return code;

  const lines = code.split('\n');
  const formattedLines = lines.map(line => {
    if (line.length <= maxLineLength) return line;

    const indentation = line.match(/^\s*/)[0];
    const content = line.trim();

    if (content.startsWith('import ') || content.startsWith('from ')) {
      return line;
    }

    const breakPoints = [
      { char: ',', suffix: '' },
      { char: ' && ', suffix: '&&' },
      { char: ' || ', suffix: '||' },
      { char: ' + ', suffix: '+' },
      { char: ') ', suffix: ')' },
      { char: '} ', suffix: '}' },
    ];

    let formattedLine = content;
    for (const { char, suffix } of breakPoints) {
      if (formattedLine.includes(char)) {
        formattedLine = formattedLine
          .split(char)
          .map(part => part.trim())
          .join(char + '\n' + indentation + '  ' + (suffix ? suffix + ' ' : ''));
      }
    }

    return indentation + formattedLine;
  });

  return formattedLines.join('\n');
};

export const CodeEditorWithHighlight = ({
  code,
  language,
  onChange,
  disabled = false,
  height = '400px' // Default height prop
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formattedCode, setFormattedCode] = useState(code);

  useEffect(() => {
    setFormattedCode(formatCode(code));
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onChange(newCode);
  };

  const scrollbarStyles = {
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
  };

  return (
    <Paper className="p-4 bg-slate-800 relative">
      <Typography variant="h6" className="mb-4 text-blue-400">
        Code Editor
      </Typography>

      {/* Edit mode */}
      <Box
        className={`${isEditing ? 'block' : 'hidden'}`}
        sx={{
          height,
          overflow: 'hidden',
          ...scrollbarStyles
        }}
      >
        <TextField
          fullWidth
          multiline
          value={code}
          onChange={handleCodeChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          disabled={disabled}
          className="font-mono h-full"
          sx={{
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              backgroundColor: '#282c34',
              overflow: 'auto',
              ...scrollbarStyles
            },
            '& .MuiOutlinedInput-root': {
              height: '100%',
              '& fieldset': {
                borderColor: 'rgb(100, 116, 139)',
              },
              '&:hover fieldset': {
                borderColor: 'rgb(148, 163, 184)',
              },
              '& textarea': {
                height: '100% !important',
                color: 'rgb(226, 232, 240)',
                padding: '12px',
                lineHeight: '1.5',
                whiteSpace: 'pre',
              },
            },
          }}
        />
      </Box>

      {/* Display mode */}
      <Box
        className={`${isEditing ? 'hidden' : 'block'} cursor-text`}
        onClick={() => !disabled && setIsEditing(true)}
        sx={{
          height,
          overflow: 'hidden',
          ...scrollbarStyles,
          '& pre': {
            height: '100% !important',
            margin: '0 !important',
          }
        }}
      >
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={atomOneDark}
          customStyle={{
            height: '100%',
            backgroundColor: '#282c34',
            padding: '12px',
            overflow: 'auto',
          }}
          wrapLongLines={true}
          showLineNumbers={true}
        >
          {formattedCode || '// Start typing your code here...'}
        </SyntaxHighlighter>
      </Box>
    </Paper>
  );
};

export default CodeEditorWithHighlight;