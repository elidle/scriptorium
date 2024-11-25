import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import ps from 'ps-tree';

// Constants
const EXECUTION_LIMITS = {
  TIME_LIMIT: 7000,    // 5 seconds
  MEMORY_LIMIT: 100,   // 100 MB
  MAX_CODE_LENGTH: 50000,  // 50KB
  MAX_INPUT_LENGTH: 1000,  // 1KB
};

const FILE_PATH = path.join(process.cwd(), 'code');

const LANGUAGE_CONFIG = {
  python: { // TODO: Add support for Python 3.8
    extension: 'py',
    compile: false,
    command: 'python', // TODO: Use python3
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
//     codeWrapper: (code) => {
//       return `
// process.stdin.resume();
// process.stdin.setEncoding('utf-8');
//
// ${code}`;
//     },
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
      const classFile = path.join(FILE_PATH, 'Main.class');
      if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      // Also clean up any inner class files
      const dir = FILE_PATH;
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
      `"${filePath}"`,               // Source file
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
      const plotFile = path.join(FILE_PATH, 'Rplots.pdf');
      if (fs.existsSync(plotFile)) fs.unlinkSync(plotFile);
    }
  },
};

const sanitizeDetails = (details) => {
    // Remove sensitive information like file paths, system info
    // Keep useful error messages
    if (!details) return null;

    return details.replace(/at\s+.*\((.*)\)/g, '') // Remove stack traces
                 .replace(/[A-Za-z]:\\.*\.[a-z]*/g, '')     // Remove Windows paths
                 .replace(/.*\/\/\/[A-Za-z]:\/.*\.[a-z]*/g, '')     // Remove Windows paths
                 .replace(/\/[\w/]+\.[a-z]/g, '')          // Remove Unix paths
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
        return 418;  // Request Timeout - code took too long
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
  const filePath = path.join(FILE_PATH, fileName);

  fs.writeFileSync(filePath, code);
  return { fileName, filePath, timestamp };
};

const cleanupFiles = (files) => {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};

function getAllProcessChildren(pid) {
    return new Promise((resolve, reject) => {
        ps(pid, (err, children) => {
            if (err) {
                reject(err);
            } else {
                resolve(children);
            }
        });
    });
}

const executeProcess = async (command, args, input = '') => {
  return new Promise((resolve, reject) => {
    let child;
    if (command === 'tsc') {
      child = spawn(command, args, { shell: true, timeout: EXECUTION_LIMITS.TIME_LIMIT});
    }
    else{
      child = spawn(command, args, { timeout: EXECUTION_LIMITS.TIME_LIMIT});
    }
    let output = '';
    let errorOutput = '';
    let isKilled = false;
    // Set up process monitoring
    const { timeout } = setupProcessMonitoring(child, async () => {
      isKilled = true;
      // Kill the process group
      try {
        if (process.platform === 'win32') {
          // On Windows, use taskkill to forcefully terminate the process tree
          const children = await getAllProcessChildren(child.pid);
          children.forEach((child) => {
            spawn('taskkill', ['/pid', child.PID, '/t', '/f']);
          });
          spawn('taskkill', ['/pid', child.pid, '/t', '/f']);
        } else {
          // On Unix, kill the entire process group
          process.kill(-child.pid, 'SIGKILL');
        }
      } catch (killError) {
        console.error('Error killing process:', killError);
      } finally {
        reject(new ExecutionError('Execution timed out', 'Process exceeded time limit', 'TIMEOUT'));
      }
    });

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
      cleanupMonitoring(timeout);
      reject(new Error(`Process error: ${error.message}`));
    });

    child.on('close', (code) => {
      cleanupMonitoring(timeout);

      if (code !== 0) {
        if (child.killed) {
          reject(new ExecutionError('Execution timed out', 'Process exceeded time limit', 'TIMEOUT'));
        }
        // TODO: Not sure if this is the best way to handle C# and TypeScript compilation errors
        if ((command === 'csc' || command === 'tsc') && output){
          reject(new Error(output));
        }
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
const setupProcessMonitoring = (child, onTimeout) => {
  const timeout = setTimeout( () => {
    // onTimeout();
    const ret = child.kill();
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

const renameFile = (oldPath, newPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

const executeCode = async (language, filePath, code, input, timestamp) => {
  const config = LANGUAGE_CONFIG[language];
  let outputPath = null;
  let actualCode = code;
  let output = '';
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
        (language === 'typescript' ?
          config.outputFile(FILE_PATH, timestamp) :
          config.outputFile(FILE_PATH)) :
        path.join(FILE_PATH, 'a.out');

      // Compile the code
      const compileArgs = config.compileArgs ?
        config.compileArgs(filePath, outputPath) :
        [filePath, '-o', outputPath];
      try {
        await executeProcess(config.compileCommand, compileArgs);
      } catch (error) {
        console.error('Compilation error:', error);
        throw new ExecutionError(
          'Compilation failed',
          sanitizeDetails(error.message),
          'COMPILATION'
        );
      }

      // Handle special cases for Java
      if (language === 'java') {
        const classFile = path.join(FILE_PATH, 'Main.class');
        if (!fs.existsSync(classFile)) {
          throw new Error('Compilation failed: Class file not generated');
        }
        output = await executeProcess('java', ['-cp', FILE_PATH, 'Main'], input);
      }
      // Handle C/C++
      else if (language === 'c' || language === 'cpp') {
        if (!fs.existsSync(outputPath)) {
          throw new Error('Compilation failed: Executable not generated');
        }
        output = await executeProcess(outputPath, [], input);
      }
      else if (language === 'typescript') {
        const runCommand = config.runCommand;
        const curFilepath = path.join(FILE_PATH, 'typescript_' + timestamp.toString() + '.js');
        const newFilepath = path.join(FILE_PATH, 'typescript_' + timestamp.toString() + '.cjs');
        await renameFile(curFilepath, newFilepath);
        const runArgs = [newFilepath];
        output = await executeProcess(runCommand, runArgs, input);
      }
      // Handle other compiled languages
      else {
        const runCommand = config.runCommand;
        const runArgs = [
          language === 'csharp' || language === 'typescript' ? outputPath :
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
    if (error instanceof ExecutionError) {
      throw error;
    }
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
    const { fileName, filePath, timestamp } = writeCodeToFile(code, language);
    const filesToCleanup = [filePath];

    if (LANGUAGE_CONFIG[language].compile) {
      filesToCleanup.push(
        language === 'java' ?
          path.join(FILE_PATH, 'Main.class') :
          LANGUAGE_CONFIG[language].outputFile(FILE_PATH)
      );
    }

    try {
      const output = await executeCode(language, filePath, code, input, timestamp);
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
      error: "Internal Server Error",
      details: sanitizeDetails(error.message),
    }, { status: 500 });
  }
}