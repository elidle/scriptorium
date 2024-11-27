"use client";

import { useState, useEffect } from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useAuth } from "@/app/contexts/AuthContext";
import UserAvatar from "@/app/components/UserAvatar";
import { notFound } from "next/navigation";
import UserProfileAvatar from "@/app/components/UserProfileAvatar";
import { User } from "@/app/types/auth";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  about?: string;
}

// Custom hook for form handling
const useProfileForm = (initialData: User | null) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: initialData?.firstname || "",
    lastName: initialData?.lastname || "",
    email: initialData?.email || "",
    phoneNumber: initialData?.phoneNumber || "",
    about: initialData?.about || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstname,
        lastName: initialData.lastname,
        email: initialData.email,
        phoneNumber: initialData.phoneNumber,
        about: initialData.about,
      });
    }
  }, [initialData]);

  return { formData, handleChange };
};

// Separate API calls into a service
const profileService = {
  async getUserData(username: string): Promise<User | null> {
    try {
      const response = await fetch(`http://localhost:3000/api/users?username=${username}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error('Failed to fetch user data');
        notFound();
      }

      const data = await response.json();
      return data.status === 'error' ? null : data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  async updateProfile(userId: string | number, data: FormData) {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async uploadAvatar(file: File, userId: string | number) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`/api/avatar/${userId}`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  async deleteAvatar(userId: string | number) {
    const response = await fetch(`/api/avatar/${userId}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};

// Toast notification component
const Toast = ({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white`}>
      {message}
    </div>
  );
};

export default function ProfileUpdate({ params }: { params: { username: string }}) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { user , setUser} = useAuth();
  const { formData, handleChange } = useProfileForm(user);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await profileService.getUserData(params.username);
      setUser(data);
    };
    fetchUserData();
  }, [params.username, setUser]);

  useEffect(() => {
    if (user) {
      setIsAuthorized(user.username === params.username);
    } else {
      setIsAuthorized(false);
    }
  }, [user, params.username]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!user) return;
      const result = await profileService.updateProfile(user.id, formData);
      if (result.message) {
        showToast(result.message);
      }
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      if (!user) return;
      await profileService.uploadAvatar(file, user.id);
      showToast("Avatar uploaded successfully");
    } catch {
      showToast("Failed to upload avatar", "error");
    }
  };

  const handleAvatarDelete = async () => {
    try {
      if (!user) return;
      await profileService.deleteAvatar(user.id);
      showToast("Avatar deleted successfully");
    } catch {
      showToast("Failed to delete avatar", "error");
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don&apos;t have permission to view or edit this profile.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-900">
      <AppBar position="static">
        <Toolbar className="w-full py-3 border-b bg-blue-500 dark:bg-gray-800">
          <div className="flex justify-between items-center w-full font-semibold">
            <div className="flex items-center mr-auto">
              <button
                className="mr-4 hover:opacity-80 transition-opacity"
                onClick={() => window.history.back()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = '/'}>
                Scriptorium
              </h1>
            </div>
            <div className="flex items-center xl:gap-10 md:gap-8 gap-2 mx-auto">
              <h1 className="text-2xl">Profile</h1>
            </div>
            <UserAvatar username={user.username} userId={user.id} />
          </div>
        </Toolbar>
      </AppBar>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 md:w-1/2">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 text-center">
                <UserProfileAvatar username={user.username} userId={user.id} />
                <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mt-4">
                  {user.firstname} {user.lastname}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{user.username}</p>
              </div>

              <div className="md:w-2/3">
                <section className="mb-6">
                  <h3 className="text-xl font-semibold text-indigo-800 dark:text-white mb-2">About Me</h3>
                  <p className="text-gray-700 dark:text-gray-300">{user.about}</p>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-semibold text-indigo-800 dark:text-white mb-2">Role</h3>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                    {user.role}
                  </span>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-indigo-800 dark:text-white mb-2">Contact</h3>
                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-800" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {user.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-800" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {user.phoneNumber}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 md:w-1/2">
            <h2 className="text-2xl font-bold text-center mb-8">Update Profile</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleAvatarDelete}
                className="mt-2 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Avatar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  {key === 'about' ? (
                    <textarea
                      name={key}
                      value={value}
                      onChange={handleChange}
                      maxLength={70}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      name={key}
                      value={value}
                      onChange={handleChange}
                      maxLength={key.includes('Name') ? 25 : key === 'email' ? 50 : 20}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Update Profile
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}