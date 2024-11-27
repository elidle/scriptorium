import { useState } from 'react';
import Image from 'next/image';
import { Avatar } from '@mui/material';

interface UserAvatarProps {
  username: string;
  userId: string | number;
  size?: number;
}

export default function UserProfileAvatar({ username, userId, size = 200 }: UserAvatarProps) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    !avatarError ? (
      <Avatar
        src={`/api/avatar/${userId}`}
        alt={username}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          mx: 'auto',
          mb: 4,
          border: 4,
          borderColor: 'indigo-800',
          dark: {
            borderColor: 'blue-900',
          },
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
        onError={() => setAvatarError(true)}
      />

      // <Avatar
      //   src={`/api/avatar/${userId}`}
      //   alt={username}
      //   width={size}
      //   height={size}
      //   className={`rounded-full mx-auto mb-4 border-4 border-indigo-800 dark:border-blue-900 transition-transform duration-300 hover:scale-105
      //     w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48`}
      //   onError={() => setAvatarError(true)}
      // />
    ) : (
        <Avatar
        alt={username}
        sx={{
            width: "clamp(90px, 15vw, 150px)", // Dynamic resizing: clamps between 72px and 120px based on viewport width
            height: "clamp(90px, 15vw, 150px)", // Dynamic resizing for height too
            fontSize: "clamp(60px, 5vw, 100px)", // Adjust font size dynamically
        }}
        className="mx-auto mb-4 border-4 border-indigo-800 dark:border-blue-900 transition-transform duration-300 hover:scale-110 ease-in-out"
        >
            {username[0].toUpperCase()}
        </Avatar>
    )
    
  );
}
