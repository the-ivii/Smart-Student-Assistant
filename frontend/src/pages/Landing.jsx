import { useNavigate } from 'react-router-dom';
import LandingPage from '../../components/LandingPage';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
  };

  return <LandingPage onGetStarted={handleGetStarted} />;
}

