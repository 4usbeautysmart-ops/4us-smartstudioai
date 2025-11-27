import React, { useEffect, useState } from 'react';
import { AppView, NavItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: AppView.DASHBOARD, label: 'Início', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { id: AppView.LIBRARY, label: 'Biblioteca', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { id: AppView.VISAGISMO, label: 'Visagismo', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: AppView.COLORISTA, label: 'Colorista Expert', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
  { id: AppView.HAIRSTYLIST, label: 'Hairstylist Visagista', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg> },
  { id: AppView.LOOK_CREATOR, label: 'Criador de Look', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> </svg> },
  { id: AppView.HAIR_THERAPIST, label: 'Terapeuta Capilar', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { id: AppView.CHATBOT, label: 'Assistente Smart', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  // Check trial status on mount and when event fires
  useEffect(() => {
    const checkTrialStatus = () => {
        const startDateStr = localStorage.getItem('trial_start_date');
        if (startDateStr) {
            const startDate = new Date(startDateStr);
            const now = new Date();
            const trialLength = 7;
            const msPerDay = 1000 * 60 * 60 * 24;
            
            const diffTime = Math.abs(now.getTime() - startDate.getTime());
            const diffDays = Math.floor(diffTime / msPerDay);
            const remaining = trialLength - diffDays;
            
            setTrialDaysLeft(remaining > 0 ? remaining : 0);
        } else {
            setTrialDaysLeft(null);
        }
    };

    checkTrialStatus();

    // Listen for custom event from Subscription component
    window.addEventListener('subscription_updated', checkTrialStatus);
    return () => window.removeEventListener('subscription_updated', checkTrialStatus);
  }, []);

  const getTrialColor = () => {
      if (trialDaysLeft === null) return 'text-white';
      if (trialDaysLeft <= 2) return 'text-red-500 border-red-500'; // Critical
      if (trialDaysLeft <= 4) return 'text-yellow-500 border-yellow-500'; // Warning
      return 'text-green-500 border-green-500'; // Good
  };

  const getTrialBg = () => {
      if (trialDaysLeft === null) return 'bg-gray-700';
      if (trialDaysLeft <= 2) return 'bg-red-500';
      if (trialDaysLeft <= 4) return 'bg-yellow-500';
      return 'bg-green-500';
  }

  const handleLogout = () => {
      localStorage.removeItem('4us_user_session');
      window.location.reload();
  };

  return (
    <div className="flex h-screen bg-studio-bg text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex flex-col bg-studio-card border-r border-studio-accent z-20 shadow-2xl">
        <div className="h-20 flex items-center justify-center border-b border-studio-accent">
            <button
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-80"
              title="Voltar ao Início"
            >
              <h1 className="hidden lg:block text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-cyan">4us!</h1>
              <span className="lg:hidden text-2xl font-bold text-neon-purple">4!</span>
            </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-4 py-3 transition-all duration-200
                    ${currentView === item.id 
                      ? 'bg-neon-purple/10 text-neon-purple border-r-2 border-neon-purple' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span className="mx-auto lg:mx-0">{item.icon}</span>
                  <span className="hidden lg:block ml-4 font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-studio-accent space-y-4">
            {/* Conditional Subscription Widget */}
            {trialDaysLeft !== null ? (
                <div className={`w-full bg-studio-bg/50 border rounded-xl p-3 shadow-lg ${getTrialColor()}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Teste PRO</span>
                        <span className="text-xs font-bold">{trialDaysLeft} Dias</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${getTrialBg()}`} 
                            style={{ width: `${(trialDaysLeft / 7) * 100}%` }}
                        ></div>
                    </div>
                    <button 
                        onClick={() => onNavigate(AppView.SUBSCRIPTION)}
                        className="text-[10px] text-gray-400 mt-2 hover:text-white underline w-full text-center"
                    >
                        Gerenciar Assinatura
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => onNavigate(AppView.SUBSCRIPTION)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-3 px-2 rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="hidden lg:inline text-sm">Assinar PRO</span>
                </button>
            )}

             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-400 text-xs mt-2 py-2 transition-colors"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="hidden lg:inline">Sair do App</span>
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[url('https://images.unsplash.com/photo-1599351431202-1721737941b3?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-studio-bg/90 backdrop-blur-sm"></div>
        <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};