import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from "@/utils/db";
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';

interface UserProfileProps {
    avatar: string;
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;
    username: string; // Added username property
}

// This function runs on the server and fetches user data.
async function getUserData(username: string): Promise<UserProfileProps | null> {

    try {
        // Find the corresponding user id from the database
        const user = await prisma.user.findUnique({
            where: { username }, // You can also check by email if needed
        });

        const id = user?.id;

        const response = await fetch(`http://localhost:3000/api/users/${id}/profile`, {
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

export default async function UserProfile({ params }: { params: { username: string } }) {
    const user = await getUserData(params.username);
    console.log(user);

    // const canEdit = user?.username == ; // Example: Only allow user with id 1 to edit their profile

    if (!user) {
        notFound(); // Triggers the 404 page
        return null;
    }

    return (
      <div className="min-h-screen bg-slate-900">
        {/* Fixed header */}
      <AppBar 
        position="fixed" 
        className="bg-slate-800 blue-500 border-b border-slate-700"
        sx={{ boxShadow: 'none' }}
      >
        <div className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <Typography 
            className="text-xl sm:text-2xl text-blue-400 flex-shrink-0" 
            variant="h5"
          >
            Scriptorium
          </Typography>
          <TextField 
            className="w-full"
            color="info"
            variant="outlined"
            label="Search All..."
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgb(30, 41, 59)',
                '&:hover': {
                  backgroundColor: 'rgb(30, 41, 59, 0.8)',
                },
              },
            }}
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[100px] whitespace-nowrap h-9"
            variant="contained"
            size="small"
          >
            Sign In
          </Button>
        </div>
      </AppBar>


      <div className="pt-16"> {/* Matches header height */}
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-blue-500 to-black-600 shadow-lg rounded-lg text-white">
      <h1 className="text-4xl font-extrabold mb-6 text-center">User Profile</h1>
      <div className="flex flex-col items-center mb-6">
        <img
        src={`/avatars/${user.avatar}.png`}
        alt="User Avatar"
        width={150}
        height={150}
        className="rounded-full border-4 border-white"
        />
        <div className="mt-4 text-center">
        <h2 className="text-3xl font-bold">{user.firstname} {user.lastname}</h2>
        </div>
      </div>
      <div className="space-y-4">
        <div>
        <label className="block text-lg font-medium">Email:</label>
        <p className="mt-1 text-xl">{user.email}</p>
        </div>
        <div>
        <label className="block text-lg font-medium">Phone Number:</label>
        <p className="mt-1 text-xl">{user.phoneNumber}</p>
        </div>
      </div>
      </div>
      </div>
      </div>
    );
}
