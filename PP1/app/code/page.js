'use client'; // This component needs to run on the client-side

import { useState } from 'react';

export default function CodeExecutor() {
    const [code, setCode] = useState('');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [language, setLanguage] = useState('python'); // Default language

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOutput('');
        setError('');

        const response = await fetch('/api/run-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, input, language }),
        });

        const result = await response.json();
        if (response.ok) {
            setOutput(result.output);
        } else {
            setError(result.error || 'Something went wrong.');
            setOutput(result.details)
        }
    };

    return (
        <div>
            <h1>Code Executor</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    rows="10"
                    cols="50"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here"
                />
                <textarea
                    rows="4"
                    cols="50"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Input for the code"
                />
                <select onChange={(e) => setLanguage(e.target.value)} value={language}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                </select>
                <button type="submit">Run Code</button>
            </form>
            {output && <pre>Output: {output}</pre>}
            {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}
        </div>
    );
}
