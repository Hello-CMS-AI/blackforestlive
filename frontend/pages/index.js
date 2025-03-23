import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login'); // Automatically redirect to /login
  }, [router]);

  return (
    <div>
      <h1>Redirecting to login...</h1>
    </div>
  );
}