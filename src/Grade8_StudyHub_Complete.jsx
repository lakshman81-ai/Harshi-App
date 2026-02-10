import React, { useState } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { StudyProvider, useStudy } from './contexts/StudyContext';
import Dashboard from './components/Dashboard';
import SubjectOverview from './components/SubjectOverview';
import StudyGuide from './components/StudyGuide';
import SettingsPanel from './components/SettingsPanel';
import { cn } from './utils';
import { ICON_MAP } from './constants';

// Navigation Wrappers
const DashboardWrapper = ({ onOpenSettings }) => {
    const navigate = useNavigate();
    return (
        <Dashboard
            onSelectSubject={(s) => navigate(`/subject/${s}`)}
            onOpenSettings={onOpenSettings}
            onGoHome={() => navigate('/')}
        />
    );
};

const SubjectOverviewWrapper = ({ onOpenSettings }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    return (
        <SubjectOverview
            subject={subjectId}
            onBack={() => navigate('/')}
            onSelectTopic={(i) => navigate(`/subject/${subjectId}/topic/${i}`)}
            onOpenSettings={onOpenSettings}
        />
    );
};

const StudyGuideWrapper = ({ onOpenSettings, studyData }) => {
    const { subjectId, topicIndex } = useParams();
    const navigate = useNavigate();

    // Validate params
    if (!subjectId || topicIndex === undefined) return <Navigate to="/" />;

    return (
        <StudyGuide
            subject={subjectId}
            topicIndex={parseInt(topicIndex, 10)}
            onBack={() => navigate(`/subject/${subjectId}`)}
            onOpenSettings={onOpenSettings}
            studyData={studyData}
            ICON_MAP={ICON_MAP}
        />
    );
};

const AppContent = () => {
  const studyData = useStudy();
  const { settings } = studyData;
  const darkMode = settings.darkMode;
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className={cn("font-sans antialiased", darkMode && "dark")}>
      <Routes>
        <Route path="/" element={<DashboardWrapper onOpenSettings={() => setShowSettings(true)} />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/subject/:subjectId" element={<SubjectOverviewWrapper onOpenSettings={() => setShowSettings(true)} />} />
        <Route path="/subject/:subjectId/topic/:topicIndex" element={<StudyGuideWrapper onOpenSettings={() => setShowSettings(true)} studyData={studyData} />} />
      </Routes>

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
