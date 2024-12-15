import React from 'react';
import { Box } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "@/app/contexts/ThemeContext";


const CodeMirrorBox = ({ label, value, onChange, disabled = false, isDarkMode = true }
: {label: string, value: string, onChange: ((value: string) => void )| null, disabled: boolean, isDarkMode: boolean}) => {
  return (
    <>
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
          onChange={onChange ? onChange : undefined}
          theme={isDarkMode ? githubDark : githubLight}
          height="100%"
          extensions={[]}
          editable={!disabled}
          placeholder={label === "Input" ? "Input goes here..." : ""}
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
    </>
  );
};

const InputOutputSection = ({ input, setInput, output}
                                                          : { input: string, setInput: (value: string) => void, output: string}) => {
  const { isDarkMode } = useTheme();
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
      disabled={false}
      onChange={setInput}
      isDarkMode={isDarkMode}
    />
    <CodeMirrorBox
      label="Output"
      onChange={null}
      value={output}
      disabled={true}
      isDarkMode={isDarkMode}
    />
  </Box>);
};

export default InputOutputSection;