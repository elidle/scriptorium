"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/code-templates/search');
  }, [router]);


  return (
    <div className="min-h-screen bg-slate-900"></div>
  );
};

export default Page;
