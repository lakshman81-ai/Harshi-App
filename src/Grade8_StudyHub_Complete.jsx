import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { StudyProvider, useStudy } from './contexts/StudyContext';
import Dashboard from './components/Dashboard';
import SubjectOverview from './components/SubjectOverview';
import StudyGuide from './components/StudyGuide';
import SettingsPanel from './components/SettingsPanel';
import { cn } from './utils';

const AppContent = () => {
  const studyData = useStudy();
  const { settings } = studyData;
  const darkMode = settings.darkMode;

  const [view, setView] = useState('dashboard');
  const [subject, setSubject] = useState(null);
  const [topicIndex, setTopicIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);



  return (
    <div className={cn("font-sans antialiased", darkMode && "dark")}>
      {view === 'dashboard' && (
        <Dashboard
          onSelectSubject={(s) => { setSubject(s); setView('subject'); }}
          onOpenSettings={() => setShowSettings(true)}
          onGoHome={() => setView('dashboard')}
        />
      )}

      {view === 'subject' && subject && (
        <SubjectOverview
          subject={subject}
          onBack={() => setView('dashboard')}
          onSelectTopic={(i) => { setTopicIndex(i); setView('study'); }}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {view === 'study' && subject && (
        <StudyGuide
          subject={subject}
          topicIndex={topicIndex}
          onBack={() => setView('subject')}
          onOpenSettings={() => setShowSettings(true)}
          studyData={studyData}
          ICON_MAP={require('./constants').ICON_MAP}
        />
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default function Grade8StudyHub() {
  return (
    <DataProvider>
      <StudyProvider>
        <AppContent />
      </StudyProvider>
    </DataProvider>
  );
}
