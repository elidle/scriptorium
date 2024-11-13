'use client'; // This component needs to run on the client-side

import { useState } from 'react';
import Prism from 'prismjs'; // for syntax highlighting
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-ruby';
import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/themes/prism.css'; // Basic Prism theme

export default function CodeExecutor() {

    const [code, setCode] = useState('// Write your code here');
    const [language, setLanguage] = useState('javascript'); // Default language
  
    // Function to handle language change
    const handleLanguageChange = (event) => {
      setLanguage(event.target.value);
    };
  
    // Syntax highlighting based on language
    const highlightCode = (code) => {
      return highlight(code, Prism.languages[language], language);
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 mt-12">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Code Editor</h1>
    
            {/* Language Dropdown */}
            <div className="mb-4">
              <label htmlFor="language" className="text-gray-700 font-medium mb-2">Select Language</label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>
    
            {/* Code Editor */} 
            <Editor
              value={code}
              onValueChange={(newCode) => setCode(newCode)}
              highlight={code => highlightCode(code)}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 12,
              }}
              className="code-editor w-full h-96 bg-gray-900 text-white rounded-md"
            />

            {/* Save Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => alert('Code Saved!')}
                className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-300"
              >
                Save Code
              </button>
            </div>
          </div>
        </div>
      );

//     const [code, setCode] = useState('');
//     const [input, setInput] = useState('');
//     const [output, setOutput] = useState('');
//     const [error, setError] = useState('');
//     const [language, setLanguage] = useState('python'); // Default language

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setOutput('');
//         setError('');

//         const response = await fetch('/api/run-code', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ code, input, language }),
//         });

//         const result = await response.json();
//         if (response.ok) {
//             setOutput(result.output);
//         } else {
//             setError(result.error || 'Something went wrong.');
//             setOutput(result.details)
//         }
//     };

//     return (
//         <div>
//             <h1>Code Executor</h1>
//             <form onSubmit={handleSubmit}>
//                 <textarea
//                     rows="10"
//                     cols="50"
//                     value={code}
//                     onChange={(e) => setCode(e.target.value)}
//                     placeholder="Write your code here"
//                 />
//                 <textarea
//                     rows="4"
//                     cols="50"
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     placeholder="Input for the code"
//                 />
//                 <select onChange={(e) => setLanguage(e.target.value)} value={language}>
//                     <option value="python">Python</option>
//                     <option value="javascript">JavaScript</option>
//                     <option value="c">C</option>
//                     <option value="cpp">C++</option>
//                     <option value="java">Java</option>
//                 </select>
//                 <button type="submit">Run Code</button>
//             </form>
//             {output && <pre>Output: {output}</pre>}
//             {error && <pre style={{ color: 'red' }}>Error: {error}</pre>}
//         </div>
//     );
}
