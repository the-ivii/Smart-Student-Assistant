import Head from 'next/head';
import { useRouter } from 'next/router';
import LandingPage from '../components/LandingPage';

export default function Landing() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Smart Study Assistant - AI-Powered Learning</title>
        <meta name="description" content="Transform your study sessions with AI-powered summaries, quizzes, and study tips" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LandingPage onGetStarted={handleGetStarted} />
    </>
  );
}

