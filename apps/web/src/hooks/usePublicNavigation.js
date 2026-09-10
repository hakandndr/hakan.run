import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const usePublicNavigation = () => {
  const navigate = useNavigate();

  return useCallback(
    (href, { behavior = 'auto' } = {}) => {
      const [path, fragment] = href.split('#', 2);
      navigate(
        {
          pathname: path || window.location.pathname,
          hash: fragment ? `#${fragment}` : '',
        },
        { state: { scrollBehavior: behavior } },
      );
    },
    [navigate],
  );
};

export default usePublicNavigation;
