import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  // Redirect to Vedic input page
  useEffect(() => {
    navigate('/vedic/input', { replace: true });
  }, [navigate]);

  return null;
};
      
export default Index;
