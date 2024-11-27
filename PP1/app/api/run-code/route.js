import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const TIME_LIMIT = 10000; // Milliseconds
const MEMORY_LIMIT_MB = 100; // Memory limit in MB

// Map to pre-built Docker images
const DOCKER_IMAGES = {
    python3: 'python/sandbox-python',
    javascript: 'node/sandbox-node',
    c: 'gcc/sandbox-gcc',
    cpp: 'gpp/sandbox-gpp',
    java: 'java/sandbox-java',
    swift: 'swift/sandbox-swift',
    go: 'go/sandbox-go',
    rust: 'rust/sandbox-rust',
    ruby: 'ruby/sandbox-ruby',
    php: 'php/sandbox-php',
};

// List of compiled languages
const COMPILED_LANGUAGES = ['c', 'cpp', 'go', 'rust', 'java', 'swift'];

export async function POST(req) {
    const { code, input = '', language } = await req.json();

    if (!code || !language || !DOCKER_IMAGES[language]) {
        return Response.json({
            status: "error",
            message: "Code and language are required, or unsupported language."
        }, { status: 400 });
    }

    const fileName = generateFileName(language);
    const tempDir = path.join(process.cwd(), 'temp');
    const filePath = path.join(tempDir, fileName);

    // Ensure the temporary directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    fs.writeFileSync(filePath, code);

    const image = DOCKER_IMAGES[language];
    const containerName = `sandbox_${Date.now()}`;
    const sandboxPath = `/sandbox/${fileName}`;

    const dockerArgs = [
        'run',
        '--rm', // Automatically remove container after execution
        '--name', containerName,
        '--memory', `${MEMORY_LIMIT_MB}m`, // Memory limit
        '--cpus', '1', // CPU limit
        '--network', 'none', // Disable network access
        '-v', `${filePath}:${sandboxPath}`, // Mount the code into container
        '-i', // Keep stdin open for interactive input
        image, // Docker image
    ];

    // Handle compiled languages
    if (COMPILED_LANGUAGES.includes(language)) {
        let compileCommand;
        let runCommand;

        switch (language) {
            case 'c':
            compileCommand = `gcc ${sandboxPath} -o /sandbox/a.out`;
            runCommand = `/sandbox/a.out`;
            break;
            case 'cpp':
            compileCommand = `g++ ${sandboxPath} -o /sandbox/a.out`;
            runCommand = `/sandbox/a.out`;
            break;
            case 'java':
            compileCommand = `javac ${sandboxPath}`;
            runCommand = `java -cp /sandbox ${fileName.split('.')[0]}`;
            break;
            case 'go':
            compileCommand = `go build -o /sandbox/a.out ${sandboxPath}`;
            runCommand = `/sandbox/a.out`;
            break;
            case 'rust':
            compileCommand = `rustc ${sandboxPath} -o /sandbox/a.out`;
            runCommand = `/sandbox/a.out`;
            break;
            case 'swift':
            compileCommand = `swiftc ${sandboxPath} -o /sandbox/a.out`;
            runCommand = `/sandbox/a.out`;
            break;
            default:
            return resolve(Response.json({
                status: "error",
                message: "Unsupported compiled language."
            }, { status: 400 }));
        }

        dockerArgs.push('sh', '-c', `${compileCommand} && ${runCommand}`);
    } else {
        // For interpreted languages, directly run the interpreter on the source code
        switch (language) {
            case 'python3':
                dockerArgs.push('python', sandboxPath);
                break;
            case 'javascript':
                dockerArgs.push('node', sandboxPath);
                break;
            case 'ruby':
                dockerArgs.push('ruby', sandboxPath);
                break;
            case 'php':
                dockerArgs.push('php', sandboxPath);
                break;
            default:
                return resolve(Response.json({
                    status: "error",
                    message: "Unsupported interpreted language."
                }, { status: 400 }));
        }
    }

    return new Promise((resolve) => {

        console.log("Running Docker container with command:", dockerArgs.join(' ')); // For debugging purposes
        const dockerProcess = spawn('docker', dockerArgs);
        console.log("Docker container started with PID:", dockerProcess.pid); // For debugging purposes

        let output = '';
        let errorOutput = '';

        dockerProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        dockerProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error("Docker error:", data.toString()); // For debugging purposes
        });

        console.log("Writing input to Docker container:", input); // For debugging purposes

        // Pipe the input into the Docker process
        if (input) {
            const inputs = input.split("\n");
            for (const line of inputs) {
                dockerProcess.stdin.write(line + "\n");
            }
            dockerProcess.stdin.end(); // End the input stream after writing
        }

        console.log("Waiting for Docker process to finish..."); // For debugging purposes

        let timeoutReached = false;

        const timeout = setTimeout(() => {
            timeoutReached = true;
            console.log("Killing Docker container due to time limit");
            // Kill Docker container if it exceeds the time limit
            spawn('docker', ['kill', containerName]);
        }, TIME_LIMIT);

        dockerProcess.on('close', (code) => {
            clearTimeout(timeout);
            fs.unlinkSync(filePath); // Clean up host file

            if (timeoutReached) {
            return resolve(Response.json({
                status: "error",
                type: "timeout",
                message: "Execution timed out in Docker container",
            }));
            }

            if (code !== 0) {
            return resolve(Response.json({
                status: "error",
                type: "execution_error",
                message: errorOutput || "Execution failed in Docker container",
            }));
            }

            resolve(Response.json({
            status: "success",
            output: output.trim(),
            }));
        });
    });
}

function generateFileName(language) {
    const extensionMap = {
        python3: 'py',
        javascript: 'js',
        c: 'c',
        cpp: 'cpp',
        java: 'java',
        typescript: 'ts',
        ruby: 'rb',
        php: 'php',
        swift: 'swift',
        go: 'go',
        rust: 'rs',
        kotlin: 'kt',
    };

    if (language === 'java') {
        return `Main.java`;
    }
    return `code_${Date.now()}.${extensionMap[language]}`;
}
