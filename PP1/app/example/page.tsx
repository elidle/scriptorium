// import { AppBar } from "@mui/material";


// const example = () => {
//     return (
//     <div className="bg-white dark:bg-gray-800 min-h-screen w-full flex justify-center items-center p-8">    
//     <AppBar>
//       <div className='w-full py-3 border-b'>

//         <div className='flex justify-between px-20 items-center font-semibold'>
//           <div>
//             <h1 className="text-2xl">Scriptorium</h1>
//           </div>
//           <div className='flex xl:gap-10 md:gap-8  gap-2'>
//             <a href="">Home</a>
//             <a href="">Work</a>
//             <a href="">About</a>
//             <a href="">Services</a>
//             <a href="">Testimonial</a>
//           </div>
//           <div>
//             <button className='py-2 px-6 bg-black text-white rounded-3xl font-semibold'>Log in</button>
//           </div>
//         </div>
        
//       </div>
//     </AppBar>

//     <div className="flex flex-col md:flex-row w-full">
//     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in">
//         <div className="flex flex-col md:flex-row">
//             <div className="md:w-1/3 text-center mb-8 md:mb-0">
//                 <img src="https://i.pravatar.cc/300" alt="Profile Picture" className="rounded-full w-48 h-48 mx-auto mb-4 border-4 border-indigo-800 dark:border-blue-900 transition-transform duration-300 hover:scale-105" />
//                 <h1 className="text-2xl font-bold text-indigo-800 dark:text-white mb-2">John Doe</h1>
//                 <p className="text-gray-600 dark:text-gray-300">Software Developer</p>
//                 <button className="mt-4 bg-indigo-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors duration-300">Edit Profile</button>
//             </div>
//             <div className="md:w-2/3 md:pl-8">
//                 <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">About Me</h2>
//                 <p className="text-gray-700 dark:text-gray-300 mb-6">
//                     Passionate software developer with 5 years of experience in web technologies. 
//                     I love creating user-friendly applications and solving complex problems.
//                 </p>
//                 <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Skills</h2>
//                 <div className="flex flex-wrap gap-2 mb-6">
//                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">JavaScript</span>
//                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">React</span>
//                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">Node.js</span>
//                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">Python</span>
//                     <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">SQL</span>
//                 </div>
//                 <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Contact Information</h2>
//                 <ul className="space-y-2 text-gray-700 dark:text-gray-300">
//                     <li className="flex items-center">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
//                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
//                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
//                         </svg>
//                         john.doe@example.com
//                     </li>
//                     <li className="flex items-center">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
//                             <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
//                         </svg>
//                         +1 (555) 123-4567
//                     </li>
//                     <li className="flex items-center">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
//                             <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
//                         </svg>
//                         San Francisco, CA
//                     </li>
//                 </ul>
//             </div>
//         </div>
//     </div>
//         {/* Blank Div on the Right */}
//         <div className="md:w-5/6 md:pl-8">
//                     {/* New blank div placeholder */}
//                     <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
//                 </div>

//     </div>
//     </div>
// )
// };

// export default example;

"use client";
import { AppBar, Toolbar } from "@mui/material";
import TemplateCard from "../components/TemplateCard";
import { CodeTemplate } from "@/app/types";
import { useState } from "react";

const templates: CodeTemplate[] = [
    {
        id: "1",
        title: "React Component",
        explanation: "A simple React component example.",
        code: "const MyComponent = () => <div>Hello, World!</div>;",
        language: "javascript",
        viewCount: 1500,
        forkCount: 300,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        author: {
            username: "johndoe",
            avatar: "/default-avatar.png"
        },
        isForked: false,
        tags: [{ id: 1, name: "react" }, { id: 2, name: "component" }],
        input: ""
    },
    {
        id: "2",
        title: "Python Script",
        explanation: "A simple Python script example.",
        code: "print('Hello, World!')",
        language: "python",
        viewCount: 2500,
        forkCount: 500,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        author: {
            username: "janedoe",
            avatar: "/default-avatar.png"
        },
        isForked: true,
        tags: [{ id: 1, name: "python" }, { id: 2, name: "script" }],
        input: ""
    }
];

const comments = [
    { id: 1, author: "Alice", text: "Great template!" },
    { id: 2, author: "Bob", text: "Very useful, thanks!" }
];

const Example = () => {
    
    const [view, setView] = useState("templates");

    return (
        <div className="bg-white dark:bg-gray-800 min-h-screen w-full">
            {/* Navigation Bar */}
            <AppBar position="static">
                <Toolbar className="w-full py-3 border-b bg-blue-500 dark:bg-gray-800">
                    <div className='flex justify-between px-20 items-center font-semibold w-full'>
                        <h1 className="text-2xl">Scriptorium</h1>
                        <div className='flex xl:gap-10 md:gap-8 gap-2'>
                            <a href="#">Home</a>
                            <a href="#">Work</a>
                            <a href="#">About</a>
                            <a href="#">Services</a>
                            <a href="#">Testimonial</a>
                        </div>
                        <button className='py-2 px-6 bg-black text-white rounded-3xl font-semibold'>Log in</button>
                    </div>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row w-full mt-4 p-8 gap-4">
                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 md:w-1/2 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in">
                    {/* Profile Info */}
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 text-center mb-8 md:mb-0">
                            <img src="https://i.pravatar.cc/300" alt="Profile Picture" className="rounded-full w-48 h-48 mx-auto mb-4 border-4 border-indigo-800 dark:border-blue-900 transition-transform duration-300 hover:scale-105" />
                            <h1 className="text-2xl font-bold text-indigo-800 dark:text-white mb-2">John Doe</h1>
                            <p className="text-gray-600 dark:text-gray-300">Software Developer</p>
                            <button className="mt-4 bg-indigo-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors duration-300">Edit Profile</button>
                        </div>
                        <div className="md:w-2/3 md:pl-8">
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">About Me</h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Passionate software developer with 5 years of experience in web technologies. 
                                I love creating user-friendly applications and solving complex problems.
                            </p>
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Skills</h2>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">JavaScript</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">React</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">Node.js</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">Python</span>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">SQL</span>
                            </div>
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Contact Information</h2>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    john.doe@example.com
                                </li>
                                <li className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    +1 (555) 123-4567
                                </li>
                                <li className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    San Francisco, CA
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:w-1/2 mb-8">
    {/* Toggle Buttons */}
    <div className="flex justify-center mb-4">
        <button
            className={`py-2 px-4 ${view === "templates" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"} rounded-l-lg`}
            onClick={() => setView("templates")}
        >
            Templates
        </button>
        <button
            className={`py-2 px-4 ${view === "comments" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"} rounded-r-lg`}
            onClick={() => setView("comments")}
        >
            Comments
        </button>
    </div>

    {/* Conditional Rendering */}
    {view === "templates" ? (
        <div className="w-full grid gap-4 max-h-96 overflow-y-auto"> {/* Add a max height and overflow */}
            {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
            ))}
        </div>
    ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in">
            {comments.map((comment) => (
                <div key={comment.id} className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300">
                        <strong>{comment.author}:</strong> {comment.text}
                    </p>
                </div>
            ))}
        </div>
    )}
</div>

    
                
            </div>
        </div>
    );
};

export default Example;


        