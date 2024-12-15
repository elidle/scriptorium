import Docker from 'dockerode';
import path from 'path';
import fs from 'fs';

const docker = new Docker({ 
    socketPath: '/var/run/docker.sock'
});
const TIME_LIMIT = 20000;
const MEMORY_LIMIT = 512 * 1024 * 1024;
const CPU_QUOTA = 50000;

const generateFileName = (language) => {
    const extensionMap = {
        python: 'py',
        javascript: 'js',
        c: 'c',
        cpp: 'cpp',
        java: 'java',
        csharp: 'cs',
        typescript: 'ts',
        r: 'R',
        kotlin: 'kt',
        swift: 'swift',
    };
    return language === 'java' ? 'Main.java' : `code_${Date.now()}.${extensionMap[language]}`;
};

const languageConfigs = {
    python: {
        image: 'python:3-alpine',
        cmd: (filename, input) => input 
            ? ['sh', '-c', `echo "${input}" | python3 ${filename}`]
            : ['python3', filename],
    },
    javascript: {
        image: 'node:alpine',
        cmd: (filename, input) => input
            ? ['sh', '-c', `echo "${input}" | node ${filename}`]
            : ['node', filename],
    },
    c: {
        image: 'gcc:latest',
        cmd: (filename, input) => input
            ? ['sh', '-c', `gcc ${filename} -o output && echo "${input}" | ./output`]
            : ['sh', '-c', `gcc ${filename} -o output && ./output`],
    },
    cpp: {
        image: 'gcc:latest',
        cmd: (filename, input) => input
            ? ['sh', '-c', `g++ ${filename} -o output && echo "${input}" | ./output`]
            : ['sh', '-c', `g++ ${filename} -o output && ./output`],
    },
    java: {
        image: 'openjdk:17-jdk-alpine',
        cmd: (filename, input) => input
            ? ['sh', '-c', `javac ${filename} && echo "${input}" | java Main`]
            : ['sh', '-c', `javac ${filename} && java Main`],
    },
    csharp: {
        image: 'mcr.microsoft.com/dotnet/sdk:6.0-alpine',
        cmd: (filename, input) => [
            'sh',
            '-c',
            `cat /code/${filename} > Program.cs && \
            dotnet new console -n app --force && \
            mv Program.cs app/ && \
            cd app && \
            ${input ? `echo "${input}" | dotnet run --no-restore` : 'dotnet run --no-restore'}`
        ],
    },
    typescript: {
        image: 'node:alpine',
        cmd: (filename, input) => [
            'sh', 
            '-c', 
            `npm install -g typescript && \
             echo "$(cat /code/${filename})" > code.ts && \
             tsc code.ts && \
             ${input ? `echo "${input}" | node code.js` : 'node code.js'}`
        ],
    },
    r: {
        image: 'r-base:latest',
        cmd: (filename, input) => input
            ? ['sh', '-c', `echo "${input}" | Rscript ${filename}`]
            : ['Rscript', filename],
    },
    kotlin: {
        image: 'zenika/kotlin:latest',
        cmd: (filename, input) => [
            'sh',
            '-c',
            `kotlinc -J-Xmx256m ${filename} -include-runtime -d out.jar && \
             ${input ? `echo "${input}" | java -Xmx256m -jar out.jar` : 'java -Xmx256m -jar out.jar'}`
        ],
    },
    swift: {
        image: 'swift:latest',
        cmd: (filename, input) => [
            'sh',
            '-c',
            `swiftc -O ${filename} -o output && \
             ${input ? `echo "${input}" | ./output` : './output'}`
        ],
    },
};

const getContainerLogs = async (container) => {
    const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
    });
    
    return new Promise((resolve) => {
        let output = '';
        logs.on('data', (chunk) => output += chunk);
        logs.on('end', () => {
            const cleanOutput = output
                .toString()
                .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u0080-\u009F]/g, '')
                .replace(/\u0001|\u0002/g, '')
            resolve(cleanOutput);
        });
    });
};

export async function POST(req) {
    const { code, input = "", language } = await req.json();

    if (!code || !language) {
        return Response.json({ status: "error", message: "Code and language are required." }, { status: 400 });
    }

    const config = languageConfigs[language];
    if (!config) {
        return Response.json({ status: "error", message: "Unsupported language." }, { status: 400 });
    }

    const tempDir = path.join('/app/temp', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });
    const fileName = generateFileName(language);
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code);

    try {
        const container = await docker.createContainer({
            Image: config.image,
            Cmd: config.cmd(fileName, input),
            WorkingDir: '/code',
            ...config.containerOptions,
            HostConfig: {
                Memory: MEMORY_LIMIT,
                MemorySwap: MEMORY_LIMIT,
                CpuPeriod: 100000,
                CpuQuota: CPU_QUOTA,
                NetworkDisabled: true,
                AutoRemove: true,
                Binds: [`${tempDir}:/code`],
            },
        });

        await container.start();

        const outputPromise = getContainerLogs(container);

        const result = await Promise.race([
            container.wait(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIME_LIMIT))
        ]);

        const output = await outputPromise;
        const codeOutput = output.toString().replace(/\u0001|\u0002/g, '');

        fs.rmSync(tempDir, { recursive: true, force: true });

        if (result.StatusCode !== 0) {
            return Response.json({
                error: "Error executing code",
                details: codeOutput || "Unknown error"
            }, { status: 500 });
        }

        return Response.json({ output: codeOutput });
    } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return Response.json({
            error: "Execution error",
            details: error.message
        }, { status: 500 });
    }
}