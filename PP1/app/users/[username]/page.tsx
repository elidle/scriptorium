'use client';

import { notFound } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import TemplateCard from '@/app/components/TemplateCard';
import UserAvatar from '@/app/components/UserAvatar';
import { CodeTemplate } from '@/app/types';
import { useAuth } from '@/app/contexts/AuthContext';
import UserProfileAvatar from '@/app/components/UserProfileAvatar';
import BaseLayoutProfile from '@/app/components/BaseLayoutProfile';
import { Comment } from '@/app/types/comment';
import { User } from '@/app/types/auth';

const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// This function runs on the server and fetches user data.
async function getUserData(username: string): Promise<User | null> {

    try {
        // Find the corresponding user id from the database
        const response = await fetch(`${domain}/api/users?username=${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store' // Ensures fresh data is fetched on each request
        });

        if (!response.ok) {
            console.error('Failed to fetch user data');
            notFound(); // Triggers the 404 page
        }

        const data = await response.json();
        return data.status === 'error' ? null : data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

async function getComments(username: string): Promise<Comment[]> {
    try {
      const response = await fetch(`${domain}/api/users/comments?username=${username}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
          cache: 'no-store' // Ensures fresh data is fetched on each request
      });

      if (!response.ok) {
          console.error('Failed to fetch user data', response.status);
          return []; // Triggers the 404 page
      }

      const data = await response.json();
      return data.status === 'error' ? [] : data;
  } catch (error) {
      console.error('Error fetching user data:', error);
      return [];
  }
}

async function getTemplates(username: string): Promise<CodeTemplate[]> {
  try {
    const response = await fetch(`${domain}/api/users/templates?username=${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Ensures fresh data is fetched on each request
    });

    if (!response.ok) {
      console.error('Failed to fetch templates', response.status);
      return []; // Return an empty array if the request fails
    }

    const data = await response.json();
    return data.status === 'error' ? [] : data.templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export default function UserProfile({ params }: { params: { username: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("templates");
  const [comments, setComments] = useState<Comment[]>([]);
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const {user: currentUser } = useAuth();

  const canEdit = currentUser?.username === params.username;
  useEffect(() => {
      const fetchUserData = async () => {
          const data = await getUserData(params.username);
          setUser(data);
      };
      fetchUserData();
  }, [params.username]); // Fetch data when the username changes


  useEffect(() => {
    const fetchUserComments = async () => {
        const data = await getComments(params.username);
        setComments(Array.isArray(data) ? data : []);;
    };
    fetchUserComments();
  }, [params.username]); // Fetch data when the username changes

  useEffect(() => {
    const fetchUserTemplates = async () => {
        const data = await getTemplates(params.username);
        setTemplates(data);
    };
    fetchUserTemplates();
  }, [params.username]); // Fetch data when the username changes

    // const canEdit = user?.username == ; // Example: Only allow user with id 1 to edit their profile
    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;// Triggers the 404 page
    }

    return (
    <BaseLayoutProfile
        user={user}
      >

      {/* Main Content */}
      <div className="flex flex-col md:flex-row w-full mt-4 p-8 gap-4">
                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 md:w-1/2 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in">
                    {/* Profile Info */}
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 text-center mb-8 md:mb-0">
                        <UserProfileAvatar username={user.username} userId={user.id} />
                          <h1 className="text-2xl font-bold text-indigo-800 dark:text-white mb-2">{user.firstname + " " + user.lastname}</h1>
                          <p className="text-gray-600 dark:text-gray-300">{user.username}</p>
                          {canEdit && (
                            <button 
                              className="mt-4 bg-indigo-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors duration-300"
                              onClick={() => window.location.href = `/users/${user.username}/edit-profile`}
                            >
                              Edit Profile
                            </button>
                          )}
                        </div>
                        <div className="md:w-2/3 md:pl-8">
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">About Me</h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">{user.about}</span>
                            </p>
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Role</h2>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">{user.role}</span>
                            </div>
                            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-4">Contact Information</h2>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    {user.email}
                                </li>
                                <li className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-800 dark:text-blue-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    {user.phoneNumber}
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
    {view === "templates" && (
        <div className="w-full grid gap-4 max-h-96 overflow-y-auto min-h-[200px]">
            {templates.length === 0 ? (
                <div className="flex items-center justify-center text-gray-500">No templates available</div>
            ) : (
                templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                ))
            )}
        </div>
    )}

    {view === "comments" && (
        <div className="w-full grid gap-4 max-h-96 overflow-y-auto min-h-[200px]">
            {comments.length === 0 ? (
                <div className="flex items-center justify-center text-gray-500">No comments yet</div>
            ) : (
                comments.map((comment) => (
                    <div key={comment.id} className="mb-4 border-b border-gray-300 dark:border-gray-700 pb-4">
                        <div className="flex items-center mb-2">
                            <UserAvatar username={comment.authorUsername} userId={comment.id} size={32} />
                            <p className="ml-2 text-gray-700 dark:text-gray-300">
                                <strong>{comment.authorUsername}</strong>
                            </p>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 ml-10">
                            {comment.content}
                        </p>
                    </div>
                ))
            )}
        </div>
    )}
</div>
            </div>
                  </BaseLayoutProfile>
    );
}