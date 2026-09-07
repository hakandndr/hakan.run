import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageView } from '@/content-source/analytics';

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    recordPageView(location.pathname);
  }, [location.pathname]);

  return null;
};

export default PageTracker;