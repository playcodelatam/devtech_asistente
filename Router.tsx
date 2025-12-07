import React, { useState, useEffect } from 'react';
import App from './App';
import SystemInstructionEditor from './components/SystemInstructionEditor';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (currentPath === '/systeminstruction') {
    return <SystemInstructionEditor onBack={() => navigate('/')} />;
  }

  return <App />;
};

export default Router;
