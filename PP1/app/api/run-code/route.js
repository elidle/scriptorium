import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Constants
const EXECUTION_LIMITS = {
  TIME_LIMIT: 5000,    // 5 seconds
  MEMORY_LIMIT: 100,   // 100 MB
  MAX_CODE_LENGTH: 50000,  // 50KB
  MAX_INPUT_LENGTH: 1000,  // 1KB
};

const LANGUAGE_CONFIG = {
  python3: {
    extension: 'py',
    compile: false,
    command: 'python3',
    fileName: (timestamp) => `python_${timestamp}.py`,
    // Add encoding header and ensure proper imports for input handling
    codeWrapper: (code) => {
      const header = '#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n';
      return header + code;
    },
    cleanup: (filePath) => {
      // Clean up source file and any potential .pyc files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const pycFile = filePath + 'c';  // Python compiled file
      if (fs.existsSync(pycFile)) fs.unlinkSync(pycFile);
    }
  },

  javascript: {
    extension: 'js',
    compile: false,
    command: 'node',
    fileName: (timestamp) => `js_${timestamp}.js`,
    // Ensure proper input handling
    codeWrapper: (code) => {
      return `
        process.stdin.resume();
        process.stdin.setEncoding('utf-8');
        
        ${code}`;
    },
    cleanup: (filePath) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  },

  java: {
    extension: 'java',
    compile: true,
    compileCommand: 'javac',
    runCommand: 'java',
    fileName: () => 'Main.java',
    className: 'Main',
    compileArgs: (filePath) => [filePath],
    // Ensure code has proper class structure
    // classTemplate: (code) => {
    //   if (!code.includes("class Main")) {
    //     return `
    //       import java.util.*;
    //       import java.io.*;
    //
    //       public class Main {
    //           public static void main(String[] args) {
    //               ${code}
    //           }
    //       }`;
    //   }
    //   return code;
    // },
    cleanup: (filePath) => {
      // Clean up both source and class files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const classFile = path.join(process.cwd(), 'Main.class');
      if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      // Also clean up any inner class files
      const dir = process.cwd();
      fs.readdirSync(dir)
        .filter(f => f.startsWith('Main$') && f.endsWith('.class'))
        .forEach(f => fs.unlinkSync(path.join(dir, f)));
    }
  },
  c: {
    extension: 'c',
    compile: true,
    compileCommand: 'gcc',
    fileName: (timestamp) => `c_${timestamp}.c`,
    outputFile: (dir) => path.join(dir, 'a.out'),
    // Add necessary includes and main function if not present
    // classTemplate: (code) => {
    //   if (!code.includes("main")) {
    //     return `
    //       #include <stdio.h>
    //       #include <stdlib.h>
    //       #include <string.h>
    //
    //       int main() {
    //           ${code}
    //           return 0;
    //       }`;
    //   }
    //   return code;
    // },
    cleanup: (filePath, outputPath) => {
      // Clean up both source and compiled files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      // Clean up any potential object files
      const objFile = filePath.replace('.c', '.o');
      if (fs.existsSync(objFile)) fs.unlinkSync(objFile);
    }
  },

  cpp: {
    extension: 'cpp',
    compile: true,
    compileCommand: 'g++',
    fileName: (timestamp) => `cpp_${timestamp}.cpp`,
    outputFile: (dir) => path.join(dir, 'a.out'),
    // Add necessary includes and main function if not present
    // classTemplate: (code) => {
    //   if (!code.includes("main")) {
    //     return `
    //       #include <iostream>
    //       #include <string>
    //       #include <vector>
    //       using namespace std;
    //
    //       int main() {
    //           ios_base::sync_with_stdio(false);
    //           cin.tie(NULL);
    //           ${code}
    //           return 0;
    //       }`;
    //   }
    //   return code;
    // },
    cleanup: (filePath, outputPath) => {
      // Clean up both source and compiled files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      // Clean up any potential object files
      const objFile = filePath.replace('.cpp', '.o');
      if (fs.existsSync(objFile)) fs.unlinkSync(objFile);
    }
  },
  csharp: {
    extension: 'cs',
    compile: true,
    compileCommand: 'csc',  // C# compiler
    runCommand: 'mono',     // Runtime for compiled executables
    fileName: (timestamp) => `csharp_${timestamp}.cs`,
    outputFile: (dir) => path.join(dir, 'Program.exe'),
    // Special settings for C#
    compileArgs: (filePath, outputPath) => [
      '/nologo',           // Suppress compiler copyright message
      '/optimize',         // Enable optimizations
      `/out:${outputPath}`,// Output file path
      filePath             // Source file
    ],
    // classTemplate: (code) => {
    //   // If code doesn't include a class/namespace definition, wrap it
    //   if (!code.includes("class Program")) {
    //     return `
    //       using System;
    //       public class Program {
    //           public static void Main(string[] args) {
    //               ${code}
    //           }
    //       }`;
    //   }
    //   return code;
    // }
  },
  typescript: {
    extension: 'ts',
    compile: true,
    compileCommand: 'tsc',    // TypeScript compiler
    runCommand: 'node',       // Node.js for running compiled JS
    fileName: (timestamp) => `typescript_${timestamp}.ts`,
    outputFile: (dir, timestamp) => path.join(dir, `typescript_${timestamp}.js`),
    // Special settings for TypeScript
    compileArgs: (filePath) => [
      '--target', 'ES2020',   // Target ECMAScript version
      '--module', 'commonjs', // Module system
      filePath               // Source file
    ],
    cleanup: (filePath, outputPath) => {
      // Need to clean up both TS and JS files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  },
  r: {
    extension: 'r',
    compile: false,          // R is interpreted
    command: 'Rscript',      // Use Rscript for command line execution
    fileName: (timestamp) => `r_${timestamp}.r`,
    // Special settings for R
    commandArgs: ['--vanilla'], // Run without saving/restoring workspace
    cleanup: (filePath) => {
      // Clean up both the R script and any potential output files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const plotFile = path.join(process.cwd(), 'Rplots.pdf');
      if (fs.existsSync(plotFile)) fs.unlinkSync(plotFile);
    }
  },
};

const sanitizeDetails = (details) => {
    // Remove sensitive information like file paths, system info
    // Keep useful error messages
    if (!details) return null;

    return details.replace(/at\s+.*\((.*)\)/g, '') // Remove stack traces
                 .replace(/[A-Za-z]:\\.*/g, '')     // Remove Windows paths
                 .replace(/\/[\w/]+/g, '')          // Remove Unix paths
                 .replace(/\[.*\]/g, '')            // Remove memory addresses
                 .trim();
}

class ExecutionError extends Error {
  constructor(message, details, errorType) {
    super(message);
    this.details = sanitizeDetails(details);
    this.statusCode = this.getStatusCode(errorType);
  }

  getStatusCode(errorType) {
    switch (errorType) {
      case 'VALIDATION':
        return 400;  // Bad request - invalid code/input
      case 'COMPILATION':
        return 422;  // Unprocessable Entity - code doesn't compile
      case 'RUNTIME':
        return 424;  // Failed Dependency - code fails during execution
      case 'TIMEOUT':
        return 408;  // Request Timeout - code took too long
      case 'MEMORY':
        return 507;  // Insufficient Storage - exceeded memory limit
      default:
        return 500;  // Internal Server Error - unexpected issues
    }
  }
}

// Helper functions
const validateInput = (code, input, language) => {
  if (!code || !language) {
    throw new ExecutionError('Code and language are required', null, 400);
  }

  if (!LANGUAGE_CONFIG[language]) {
    throw new ExecutionError('Unsupported language', `Language ${language} is not supported`, 400);
  }

  if (code.length > EXECUTION_LIMITS.MAX_CODE_LENGTH) {
    throw new ExecutionError('Code too long', 'Code exceeds maximum length limit', 400);
  }

  if (input && input.length > EXECUTION_LIMITS.MAX_INPUT_LENGTH) {
    throw new ExecutionError('Input too long', 'Input exceeds maximum length limit', 400);
  }
};

const writeCodeToFile = (code, language) => {
  const timestamp = Date.now();
  const config = LANGUAGE_CONFIG[language];
  const fileName = config.fileName(timestamp);
  const filePath = path.join(process.cwd(), fileName);

  fs.writeFileSync(filePath, code);
  return { fileName, filePath };
};

const cleanupFiles = (files) => {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};

const executeProcess = async (command, args, input = '') => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let output = '';
    let errorOutput = '';

    // Set up process monitoring
    const { timeout, memoryCheckInterval } = setupProcessMonitoring(child);

    // Handle input if provided
    if (input) {
      writeInput(child, input);
    }

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('error', (error) => {
      cleanupMonitoring(timeout, memoryCheckInterval);
      reject(new Error(`Process error: ${error.message}`));
    });

    child.on('close', (code) => {
      cleanupMonitoring(timeout, memoryCheckInterval);
      if (code !== 0) {
        reject(new Error(errorOutput || 'Process exited with code ' + code));
      } else {
        resolve(output);
      }
    });
  });
};

// Helper for writing input to process
const writeInput = (process, input) => {
  const inputLines = input.split('\n');
  for (const line of inputLines) {
    process.stdin.write(line + '\n');
  }
  process.stdin.end();
};

// Helper for process monitoring
const setupProcessMonitoring = (child) => {
  const timeout = setTimeout(() => {
    child.kill();
  }, EXECUTION_LIMITS.TIME_LIMIT);

  // const memoryCheckInterval = setInterval(() => {
  //   const memoryUsage = process.memoryUsage();
  //   if (memoryUsage.heapUsed / 1024 / 1024 > EXECUTION_LIMITS.MEMORY_LIMIT) {
  //     process.kill();
  //   }
  // }, 100);

  return { timeout }; // memoryCheckInterval?
};

// Helper for cleaning up monitoring
const cleanupMonitoring = (timeout) => { // memoryCheckInterval?
  clearTimeout(timeout);
  // clearInterval(memoryCheckInterval);
};

const executeCode = async (language, filePath, code, input) => {
  const config = LANGUAGE_CONFIG[language];
  let outputPath = null;
  let actualCode = code;
  let output = '';
  console.log("Code: ", code); // TODO: Debugging

  try {
    // Pre-process code if needed
    if (config.classTemplate) {
      actualCode = config.classTemplate(code);
    }
    if (config.codeWrapper) {
      actualCode = config.codeWrapper(code);
    }

    // Write code to file
    fs.writeFileSync(filePath, actualCode, 'utf8');

    // For compiled languages
    if (config.compile) {
      // Set output path based on language config
      outputPath = config.outputFile ?
        config.outputFile(process.cwd()) :
        path.join(process.cwd(), 'a.out');

      // Compile the code
      const compileArgs = config.compileArgs ?
        config.compileArgs(filePath, outputPath) :
        [filePath, '-o', outputPath];
      try {
        await executeProcess(config.compileCommand, compileArgs);
      } catch (error) {
        throw new ExecutionError(
          'Compilation failed',
          sanitizeDetails(error.message),
          'COMPILATION'
        );
      }

      // Handle special cases for Java
      if (language === 'java') {
        const classFile = path.join(process.cwd(), 'Main.class');
        if (!fs.existsSync(classFile)) {
          throw new Error('Compilation failed: Class file not generated');
        }
        output = await executeProcess('java', ['-cp', process.cwd(), 'Main'], input);
      }
      // Handle C/C++
      else if (language === 'c' || language === 'cpp') {
        if (!fs.existsSync(outputPath)) {
          throw new Error('Compilation failed: Executable not generated');
        }
        output = await executeProcess(outputPath, [], input);
      }
      // Handle other compiled languages
      else {
        const runCommand = config.runCommand;
        const runArgs = [
          language === 'csharp' ? outputPath :
          language === 'kotlin' ? path.basename(outputPath) :
          path.basename(outputPath, path.extname(outputPath))
        ];
        output = await executeProcess(runCommand, runArgs, input);
      }
    }
    // For interpreted languages
    else {
      const args = [...(config.commandArgs || []), filePath];
      output = await executeProcess(config.command, args, input);
    }

    return output;

  } catch (error) {
    throw new Error(`Execution failed: ${error.message}`);
  } finally {
    try {
      // Use language-specific cleanup if available
      if (config.cleanup) {
        config.cleanup(filePath, outputPath);
      } else {
        // Default cleanup
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        if (outputPath && fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      // Don't throw cleanup errors, just log them
    }
  }
};

export async function POST(req) {
  try {
    const { code, input = '', language } = await req.json();

    // Validate inputs
    validateInput(code, input, language);

    // Write code to file
    const { fileName, filePath } = writeCodeToFile(code, language);
    const filesToCleanup = [filePath];

    if (LANGUAGE_CONFIG[language].compile) {
      filesToCleanup.push(
        language === 'java' ?
          path.join(process.cwd(), 'Main.class') :
          LANGUAGE_CONFIG[language].outputFile(process.cwd())
      );
    }

    try {
      const output = await executeCode(language, filePath, code, input);
      return Response.json({ output });
    } finally {
      cleanupFiles(filesToCleanup);
    }

  } catch (error) {
    const response = {
      error: error.message,
      details: error.details
    };

    if (error instanceof ExecutionError) {
      return Response.json(response, { status: error.statusCode });
    }

    // Unexpected errors still return 500
    return Response.json({
      error: 'Internal server error',
      details: sanitizeDetails(error.message)
    }, { status: 500 });
  }
}