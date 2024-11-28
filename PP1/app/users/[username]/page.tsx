'use client';

import { notFound } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import TemplateCard from '@/app/components/TemplateCard';
import UserAvatar from '@/app/components/UserAvatar';
import { CodeTemplate } from '@/app/types';
import { useAuth } from '@/app/contexts/AuthContext';
import UserProfileAvatar from '@/app/components/UserProfileAvatar';
import BaseLayoutProfile from '@/app/components/BaseLayoutProfile';

interface UserProfileProps {
    avatar: string;
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;        
    username: string;
    role: string;
    id: string | number;
    about: string;
}

async function getUserData(username: string): Promise<UserProfileProps | null> {
    try {
        const response = await fetch(`http://localhost:3000/api/users?username=${username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            notFound();
        }

        const data = await response.json();
        return data.status === 'error' ? null : data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

async function getComments(username: string, page: number): Promise<Comment[]> {
    try {
        const response = await fetch(`http://localhost:3000/api/users/comments?username=${username}&page=${page}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error('Failed to fetch comments');
            return [];
        }

        const data = await response.json();
        return data.status === 'error' ? [] : data.comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
}

async function getTemplates(username: string, page: number): Promise<CodeTemplate[]> {
    try {
        const response = await fetch(`http://localhost:3000/api/users/templates?username=${username}&page=${page}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error('Failed to fetch templates');
            return [];
        }

        const data = await response.json();
        return data.status === 'error' ? [] : data.templates;
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

export default function UserProfile({ params }: { params: { username: string } }) {
    const [user, setUser] = useState<UserProfileProps | null>(null);
    const [view, setView] = useState("templates");
    const [comments, setComments] = useState<any[]>([]);
    const [templates, setTemplates] = useState<CodeTemplate[]>([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [templatesPage, setTemplatesPage] = useState(1);
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const { user: currentUser } = useAuth();

    const isLoggedIn = !!currentUser;
    const canEdit = currentUser?.username === params.username;

    useEffect(() => {
        const fetchUserData = async () => {
            const data = await getUserData(params.username);
            setUser(data);
        };
        fetchUserData();
    }, [params.username]);

    const fetchMoreData = async (type: string) => {
        if (type === 'templates' && !loadingTemplates) {
            setLoadingTemplates(true);
            const newTemplates = await getTemplates(params.username, templatesPage);
            setTemplates((prev) => [...prev, ...newTemplates]);
            setTemplatesPage((prev) => prev + 1);
            setLoadingTemplates(false);
        }

        if (type === 'comments' && !loadingComments) {
            setLoadingComments(true);
            const newComments = await getComments(params.username, commentsPage);
            setComments((prev) => [...prev, ...newComments]);
            setCommentsPage((prev) => prev + 1);
            setLoadingComments(false);
        }
    };

    const handleScroll = (event: React.UIEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        const bottom = target.scrollHeight === target.scrollTop + target.clientHeight;
        if (bottom) {
            if (view === 'templates') {
                fetchMoreData('templates');
            } else if (view === 'comments') {
                fetchMoreData('comments');
            }
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const initialTemplates = await getTemplates(params.username, 1);
            setTemplates(initialTemplates);
            const initialComments = await getComments(params.username, 1);
            setComments(initialComments);
        };
        fetchInitialData();
    }, [params.username]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <BaseLayoutProfile user={user}>
            <div className="flex flex-col md:flex-row w-full mt-4 p-8 gap-4 items-center justify-center items-center">
                <div className="bg-white dark:bg-gray-800 md:w-1/2 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in">
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
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    {user.phoneNumber}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                    </div>
         
        </BaseLayoutProfile>
    );
}
