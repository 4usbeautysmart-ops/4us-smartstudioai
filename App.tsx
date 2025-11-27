import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Visagismo } from './components/Visagismo';
import { Colorista } from './components/Colorista';
import { Hairstylist } from './components/Hairstylist';
import { LookCreator } from './components/LiveAssistant';
import { HairTherapist } from './components/HairTherapist';
import { Chatbot } from './components/Chatbot';
import { Dashboard } from './components/Dashboard';
import { Subscription } from './components/Subscription';
import { Library } from './components/Library';
import { Login } from './components/Login';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const session = localStorage.getItem('4us_user_session');
    if (session) {
        setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      setCurrentView(AppView.DASHBOARD);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case AppView.VISAGISMO:
        return <Visagismo />;
      case AppView.COLORISTA:
        return <Colorista />;
      case AppView.HAIRSTYLIST:
        return <Hairstylist />;
      case AppView.LOOK_CREATOR:
        return <LookCreator />;
      case AppView.HAIR_THERAPIST:
        return <HairTherapist />;
      case AppView.CHATBOT:
        return <Chatbot />;
      case AppView.SUBSCRIPTION:
        return <Subscription />;
      case AppView.LIBRARY:
        return <Library />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;