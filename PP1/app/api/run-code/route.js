import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const TIME_LIMIT = 5000; // Time limit in milliseconds
const MEMORY_LIMIT_MB = 100; // Memory limit in megabytes

const generateFileName = (language) => {
    const extensionMap = {
        python3: 'py',
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
        return Response.json({ status: "error", message: "Code and language are required." }, { status: 400 });
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
            return Response.json({status: "error", message: "Unsupported language."}, { status: 400 });
    }

    return new Promise((resolve) => {
        const child = spawn(command, args);

        if (language === 'javascript' || language === 'python3') {
            // const inputlist = input.split("\n");
            // child.stdin.write(input); // Provide input

            const inputs = input.split("\n"); // Split the input by newlines

            for (const line of inputs) {
                child.stdin.write(line + "\n"); // Write each line to the child process
            }

            child.stdin.end(); // Close the input stream
            // const child = spawn(command, args);
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
                // execChild.stdin.write(input); // Provide input

                const inputs = input.split("\n"); // Split the input by newlines

                for (const line of inputs) {
                    execChild.stdin.write(line + "\n"); // Write each line to the child process
                }

                execChild.stdin.end(); // Close the input stream

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
                            Response.json({
                                error: "Error executing code",
                                details: errorOutput || "Unknown error"
                            }, { status: 500 })
                        );
                    }
                    resolve(Response.json({ output }));
                });
                return; // Prevent further code execution
            }
            else if (language === 'java') {
                // Check if Main.class exists before attempting to execute
                const classFilePath = path.join(process.cwd(), 'Main.class');
                if (!fs.existsSync(classFilePath)) {
                    return resolve(
                        Response.json({
                            error: "Compilation error",
                            details: errorOutput || "Failed to compile Java code"
                        }, { status: 500 })
                    );
                }

                // Execute the compiled Java class file
                const execChild = spawn('java', ['-cp', process.cwd(), 'Main']); // Ensure 'Main' matches the class name

                // execChild.stdin.write(input); // Provide input

                const inputs = input.split("\n"); // Split the input by newlines

                for (const line of inputs) {
                    execChild.stdin.write(line + "\n"); // Write each line to the child process
                }

                execChild.stdin.end(); // Close the input stream

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
                            Response.json({
                                error: "Error executing code",
                                details: errorOutput || "Unknown error"
                            }, { status: 500 })
                        );
                    }
                    resolve(Response.json({ output }));
                });
                return;
            }

            if (code !== 0) {
                return resolve(
                    Response.json({
                        error: "Error executing code",
                        details: errorOutput || "Unknown error"
                    }, { status: 500 })
                );
            }

            resolve(Response.json({ output }));
        });
    });
}