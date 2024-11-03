// import { NextResponse } from 'next/server';
// import { spawn } from 'child_process';
// import path from 'path';
// import fs from 'fs';

// // Create a unique filename for the code based on the language
// const generateFileName = (language) => {
//     const extensionMap = {
//         python: 'py',
//         javascript: 'js',
//         c: 'c',
//         cpp: 'cpp',
//         java: 'java',
//     };
//     return `code_${Date.now()}.${extensionMap[language]}`;
// };

// export async function POST(req) {
//     const { code, input, language } = await req.json();

//     // Validate input
//     if (!code || !language) {
//         return NextResponse.json({ error: "Code and language are required." }, { status: 400 });
//     }

//     const fileName = generateFileName(language);
//     const filePath = path.join(process.cwd(), fileName);

//     // Write the code to a temporary file
//     fs.writeFileSync(filePath, code);

//     // Determine the command and args based on the language
//     let command;
//     let args = [];

//     switch (language) {
//         case 'python':
//             command = 'python';
//             args.push(filePath);
//             break;
//         case 'javascript':
//             command = 'node';
//             args.push(filePath);
//             break;
//         case 'c':
//             command = 'gcc';
//             args.push(filePath, '-o', 'output');
//             break;
//         case 'cpp':
//             command = 'g++';
//             args.push(filePath, '-o', 'output');
//             break;
//         case 'java':
//             command = 'javac';
//             args.push(filePath);
//             break;
//         default:
//             return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
//     }

//     // Spawn a child process to run the code
//     const child = spawn(command, args);

//     // Create variables to store the output
//     let output = '';
//     let errorOutput = '';

//     // If there's input to provide, write it to stdin
//     if (input) {
//         child.stdin.write(input);
//         child.stdin.end(); // Close stdin after writing input
//     }

//     // Listen for data from stdout
//     child.stdout.on('data', (data) => {
//         output += data.toString();
//     });

//     // Listen for data from stderr
//     child.stderr.on('data', (data) => {
//         errorOutput += data.toString();
//     });

//     // Listen for the child process to exit
//     return new Promise((resolve) => {
//         child.on('close', (code) => {
//             // Clean up: Delete the temporary file
//             fs.unlinkSync(filePath);
//             if (language === 'c' || language === 'cpp') {
//                 fs.unlinkSync(path.join(process.cwd(), 'output')); // Clean up compiled output
//             } else if (language === 'java') {
//                 fs.unlinkSync(filePath); // Clean up the compiled Java file
//                 fs.unlinkSync(path.join(process.cwd(), fileName.replace('.java', '.class'))); // Clean up the compiled Java class
//             }

//             if (code !== 0) {
//                 return resolve(
//                     NextResponse.json({
//                         error: "Error executing code",
//                         details: errorOutput || "Unknown error"
//                     }, { status: 500 })
//                 );
//             }

//             // If C or C++ was executed, run the output binary
//             if (language === 'c' || language === 'cpp') {
//                 const outputChild = spawn(`./output`);
//                 let binaryOutput = '';

//                 outputChild.stdout.on('data', (data) => {
//                     binaryOutput += data.toString();
//                 });

//                 outputChild.stderr.on('data', (data) => {
//                     errorOutput += data.toString();
//                 });

//                 outputChild.on('close', (binaryCode) => {
//                     resolve(NextResponse.json({ output: binaryOutput || errorOutput }));
//                 });
//             } else {
//                 resolve(NextResponse.json({ output }));
//             }
//         });
//     });
// }

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const TIME_LIMIT = 5000; // Time limit in milliseconds
const MEMORY_LIMIT_MB = 100; // Memory limit in megabytes

const generateFileName = (language) => {
    const extensionMap = {
        python: 'py',
        javascript: 'js',
        c: 'c',
        cpp: 'cpp',
        java: 'java',
    };

    // For Java, force the file name to be "Main.java"
    if (language === 'java') {
        return `Main.java`;
    }

    return `code_${Date.now()}.${extensionMap[language]}`;
};

export async function POST(req) {
    const { code, input = "", language } = await req.json();

    if (!code || !language) {
        return NextResponse.json({ error: "Code and language are required." }, { status: 400 });
    }

    const fileName = generateFileName(language);
    const filePath = path.join(process.cwd(), fileName);

    fs.writeFileSync(filePath, code);

    let command;
    let args = [];

    switch (language) {
        case 'python3':
            command = 'python3';
            args.push(filePath);
            break;
        case 'javascript':
            command = 'node';
            args.push(filePath);
            break;
        case 'c':
            command = 'gcc';
            args.push(filePath, '-o', 'output');
            break;
        case 'cpp':
            command = 'g++';
            args.push(filePath, '-o', 'output');
            break;
        case 'java':
            command = 'javac';
            args.push(filePath);
            break;
        default:
            return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
    }

    return new Promise((resolve) => {
        const child = spawn(command, args);

        if (language === 'javascript' || language === 'python') {
            child.stdin.write(input + '\n');
            child.stdin.end();
        } 

        let output = '';
        let errorOutput = '';

        const timeout = setTimeout(() => {
            child.kill();
        }, TIME_LIMIT);

        const memoryCheckInterval = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            if (memoryUsage.heapUsed / 1024 / 1024 > MEMORY_LIMIT_MB) {
                child.kill();
            }
        }, 100);

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            clearInterval(memoryCheckInterval);
            fs.unlinkSync(filePath);
            if (language === 'c' || language === 'cpp') {
                // Execute the compiled output
                const execChild = spawn(path.join(process.cwd(), 'output'));

                execChild.stdout.on('data', (data) => {
                    output += data.toString();
                });

                execChild.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                execChild.on('close', (execCode) => {
                    fs.unlinkSync(path.join(process.cwd(), 'output')); // Clean up the compiled file
                    if (execCode !== 0) {
                        return resolve(
                            NextResponse.json({
                                error: "Error executing code",
                                details: errorOutput || "Unknown error"
                            }, { status: 500 })
                        );
                    }
                    resolve(NextResponse.json({ output }));
                });
                return; // Prevent further code execution
            }
            else if (language === 'java') {
                // Check if Main.class exists before attempting to execute
                const classFilePath = path.join(process.cwd(), 'Main.class');
                if (!fs.existsSync(classFilePath)) {
                    return resolve(
                        NextResponse.json({
                            error: "Compilation error",
                            details: errorOutput || "Failed to compile Java code"
                        }, { status: 500 })
                    );
                }

                // Execute the compiled Java class file
                const execChild = spawn('java', ['-cp', process.cwd(), 'Main']); // Ensure 'Main' matches the class name

                execChild.stdout.on('data', (data) => {
                    output += data.toString();
                });

                execChild.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                execChild.on('close', (execCode) => {
                    // Only attempt to delete if it exists
                    if (fs.existsSync(classFilePath)) {
                        fs.unlinkSync(classFilePath); // Clean up the compiled class file
                    }

                    if (execCode !== 0) {
                        return resolve(
                            NextResponse.json({
                                error: "Error executing code",
                                details: errorOutput || "Unknown error"
                            }, { status: 500 })
                        );
                    }
                    resolve(NextResponse.json({ output }));
                });
                return;
            }

            if (code !== 0) {
                return resolve(
                    NextResponse.json({
                        error: "Error executing code",
                        details: errorOutput || "Unknown error"
                    }, { status: 500 })
                );
            }

            resolve(NextResponse.json({ output }));
        });
    });
}

