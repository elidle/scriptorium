"use client"; // This component should run on the client side

import { useState } from "react";

export default function ProfileUpdate({ userId, initialData }) {
  // Initialize states for each input field
  const [avatar, setAvatar] = useState(initialData?.avatar || "");
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validAvatars = [
    "../public/avatars/avatar1.png",
    "../public/avatars/avatar2.png",
    "../public/avatars/avatar3.png",
    "../public/avatars/avatar4.png",
    "../public/avatars/avatar5.png",
    "../public/avatars/avatar6.png",
    "../public/avatars/avatar7.png",
    "../public/avatars/avatar8.png",
    "../public/avatars/avatar9.png",
    "../public/avatars/avatar10.png",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Request data
    const data = {
      avatar,
      firstName,
      lastName,
      email,
      phoneNumber,
    };

    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
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

  return (
    <div>
      <h1>Update Profile</h1>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Avatar selection */}
        <label>
          Avatar:
          <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
            <option value="">Select Avatar</option>
            {validAvatars.map((avatarPath, index) => (
              <option key={index} value={avatarPath}>
                Avatar {index + 1}
              </option>
            ))}
          </select>
        </label>

        {/* First Name */}
        <label>
          First Name:
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
        </label>

        {/* Last Name */}
        <label>
          Last Name:
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
        </label>

        {/* Email */}
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </label>

        {/* Phone Number */}
        <label>
          Phone Number:
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
          />
        </label>

        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
