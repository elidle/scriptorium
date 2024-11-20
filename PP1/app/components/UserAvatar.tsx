import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@mui/material';

interface UserAvatarProps {
  username: string;
  userId: string | number;
  size?: number;
}

export default function UserAvatar({ username, userId, size = 40 }: UserAvatarProps) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    username[0] === '[' ? (
      <div className={`relative h-${size/4} w-${size/4}`}>
        <Avatar className={`bg-blue-600 h-${size/4} w-${size/4}`}>
          ?
        </Avatar>
      </div>
    ) : (
      <Link href={`/users/${username}`} className={`relative h-${size/4} w-${size/4}`}>
        {!avatarError ? (
          <Image
            src={`/api/avatar/${userId}`}
            alt={username}
            width={size}
            height={size}
            className="rounded-full object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <Avatar className={`bg-blue-600 h-${size/4} w-${size/4}`}>
            {username[0].toUpperCase()}
          </Avatar>
        )}
      </Link>
    )  
  );
}