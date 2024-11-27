<<<<<<< HEAD
import React, {useCallback} from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
const CodeMirror = ReactCodeMirror;
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
=======
import React, {useEffect} from 'react';
import CodeMirror from '@uiw/react-codemirror';
>>>>>>> 08decae00ede2f1e68bd2cdb75f4fb75fd4265f0
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import {cpp, csharp, java} from '@codemirror/legacy-modes/mode/clike';
import { Box} from '@mui/material';
import {useTheme} from "@/app/contexts/ThemeContext";
import {githubDark, githubLight} from "@uiw/codemirror-theme-github";
import {r} from "@codemirror/legacy-modes/mode/r";

const languageMap: Record<string, ReturnType<typeof StreamLanguage.define>> = {
  python: StreamLanguage.define(python),
  javascript: StreamLanguage.define(javascript),
  java: StreamLanguage.define(java),
  c: StreamLanguage.define(cpp),  // C uses the C++ mode with different settings
  cpp: StreamLanguage.define(cpp),
  csharp: StreamLanguage.define(csharp),
  typescript: StreamLanguage.define(javascript),
  r: StreamLanguage.define(r)
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
}) => {
  const { theme, isDarkMode } = useTheme();

  const getDefaultCodeStarter = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python':
        return '# Start typing your Python code!\nprint("Hello, World!")';

      case 'javascript':
        return '// Start typing your JavaScript code!\nconsole.log("Hello, World!");';

      case 'java':
        return `// Start typing your Java code!
import java.util.*;
import java.io.*;

public class Main {
   public static void main(String[] args) {
       System.out.println("Hello, World!");
   }
}`;

      case 'typescript':
        return '// Start typing your TypeScript code!\nconsole.log("Hello, World!");';

      case 'c':
        return `// Start typing your C code!
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
   printf("Hello, World!\\n");
   return 0;
}`;

      case 'cpp':
        return `// Start typing your C++ code!
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
   ios_base::sync_with_stdio(false);
   cin.tie(NULL);
   printf("Hello, World!\\n");
   return 0;
}`;

     case 'csharp':
       return `// Start typing your C# code!
using System;
public class Program {
   public static void Main(string[] args) {
       Console.WriteLine("Hello, World!");
   }
}`;

    case 'r':
      return `# Start typing your R code!
world <- "Mars"    
print(paste("Hello,", world, "!"))`;
    case 'swift':
      return `// Start typing your Swift code!
import Foundation
print("Hello, World!");`;
    case 'kotlin':
      return `// Start typing your Kotlin code!
import java.util.*
import kotlin.collections.*
import kotlin.io.*
import kotlin.text.*

fun main(args: Array<String>) {
    // For better performance in competitive programming
    val reader = System.\`in\`.bufferedReader()
    val writer = System.out.bufferedWriter()
    
    println("Hello, World!")
    
    writer.flush()
}`;
    default:
      return '// Start typing your code here...';
   }
  };

  const onChangeSetLocal = (code: string) => {
    localStorage.setItem(language + 'Code', code);
    onChange(code);
  }

  useEffect(() => {
    if(!language) return;
    const previousCode = localStorage.getItem(language + 'Code');
    if(previousCode) {
      onChange(previousCode);
    }
    else{
      onChange(getDefaultCodeStarter(language));
    }
  }, [language]);

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
          onChange={onChangeSetLocal}
          theme={isDarkMode ? githubDark : githubLight}
          height="100%"
          minHeight={minHeight}
          width='100%'
          extensions={[getLanguageExtension(language)]}
          editable={!disabled}
          // placeholder={getDefaultPlaceholder(language)}
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
          }}
        />
      </Box>
    </Box>
  );
};
