"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { notFound } from "next/navigation";
import UserProfileAvatar from "@/app/components/UserProfileAvatar";
import { fetchAuth } from "@/app/utils/auth";
import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { useRouter} from "next/navigation";
import { User } from '@/app/types';
import BaseLayoutProfile from "@/app/components/BaseLayoutProfile";

// const domain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getUserData(currentUser: User | null, setAccessToken: (token: string) => void, router: ReturnType<typeof useRouter> ): Promise<User | null> {
  try {
    const option: RequestInit =  {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store'
    };

    const response = await fetchAuth({
      url: `/api/users?username=${currentUser?.username}`,
      options: option,
      user: currentUser,
      setAccessToken,
      router
    });

    if (!response || !response.ok) {
      console.error('Failed to fetch user data');
      notFound();
    }

    const data = await response.json();
    return data.status === 'error' ? null : data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  about?: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
}

export default function ProfileUpdate({ params }: { params: { username: string }}) {
  const router = useRouter();
  const { user: currentUser, accessToken, setAccessToken } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [about, setAbout] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await getUserData(currentUser, setAccessToken, router);
      setUser(data);
      setIsLoaded(true);
    };
    fetchUserData();
  }, [params.username, currentUser, setAccessToken, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstname);
      setLastName(user.lastname);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber);
      setAbout(user.about || "");
      setIsCurrentUser(currentUser?.username === params.username);
    }
  }, [user, currentUser, params.username]);

  useEffect(() => {
    if (error) {
      alert("An error occurred: " + error);
    }
  }, [error]);

  const handleFileUpload = (file: File, userid: number | string) => {
    const formData = new FormData();
    formData.append('image', file);
    const option = {
      method: 'POST',
      body: formData,
    };

    fetchAuth({ url: `/api/avatar/${userid}`, options: option, user: currentUser, setAccessToken, router })
      .then((response) => response ? response.json() : Promise.reject('Response is null'))
      .then((data) => {
        console.log('File uploaded successfully:', data);
        setMessage("File uploaded successfully");
      })
      .catch((error) => console.error('Error uploading file:', error));
  };

  const handleAvatarDelete = (userid: number | string) => {
    const option = {
      method: 'DELETE',
    };

    fetchAuth({ url: `/api/avatar/${userid}`, options: option, user: currentUser, setAccessToken, router })
      .then((response) => response ? response.json() : Promise.reject('Response is null'))
      .then((data) => {
        console.log('Avatar deleted successfully:', data);
        setMessage("Avatar deleted successfully");
      })
      .catch((error) => console.error('Error deleting avatar:', error));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const data: FormData = {
      firstname: firstName,
      lastname: lastName,
      email: email,
      phoneNumber: phoneNumber,
      about: about,
    };

    try {
      const option = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "access-token": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      };

      const response = await fetchAuth({
        url: `/api/users/${user?.id}/profile`,
        options: option,
        user: currentUser,
        setAccessToken,
        router
      });

      if (!response) {
        setError("Failed to update profile");
        return;
      }

      const result: ApiResponse = await response.json();
      if (response.ok) {
        setMessage(result.message || "Profile updated successfully");
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An error occurred. Please try again.");
    }
  };

  if (!isCurrentUser) {
    return <div className="min-h-screen flex items-center justify-center">You are not authorized to view this page</div>;
  }

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">User not found</div>;
  }

  // Rest of your JSX remains the same
  return (
    <BaseLayoutProfile user={user}>
      <div className="flex flex-col md:flex-row w-full mt-4 p-8 gap-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 md:w-1/2 rounded-xl shadow-2xl max-w-4xl w-full p-8 transition-all duration-300 animate-fade-in flex-grow">
          {/* Profile Info */}
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 text-center mb-8 md:mb-0">
              {/* Avatar */}
              <UserProfileAvatar username={user.username} userId={user.id} />
              <h1 className="text-2xl font-bold text-indigo-800 dark:text-white mb-2">{user.firstname + " " + user.lastname}</h1>
              <p className="text-gray-600 dark:text-gray-300">{user.username}</p>
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
        <div className="flex flex-col items-center bg-white md:w-1/2 mb-8 rounded-lg p-6 max-h-[80vh] overflow-y-auto flex-grow">
          <h1 className="text-2xl font-bold mb-4">Update Profile</h1>

          {/* Display message or error */}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Avatar Upload Section */}
          <div className="w-full md:w-3/4 lg:w-1/2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Avatar:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  handleFileUpload(file, user.id); // Upload the file to the server
                }
              }}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Delete Avatar Button */}
          <div className="w-full md:w-3/4 lg:w-1/2 mb-4">
            <button
              type="button"
              onClick={() => handleAvatarDelete(user.id)}
              className="mt-1 block w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete Avatar
            </button>
          </div>

          {/* Profile Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4 w-full md:w-3/4 lg:w-1/2">
            {/* First Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name:
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                maxLength={25}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Last Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name:
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                maxLength={25}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                maxLength={50}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number:
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={20}
                placeholder="Phone Number"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* About Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
              About:
              </label>
              <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="About"
              maxLength={70}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
            Update Profile
            </button>
          </form>
        </div>
      </div>
    </BaseLayoutProfile>
  );
}