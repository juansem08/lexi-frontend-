import React, { useCallback, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Layout, type ActiveTab } from './components/Layout';
import { ReaderView, type ReaderSource } from './components/ReaderView';
import { OcrUploader } from './components/OcrUploader';
import { GamificationBoard } from './components/GamificationBoard';
import { PreferencesPanel } from './components/PreferencesPanel';
import { EducatorPortal } from './components/EducatorPortal';
import { LoginModal } from './components/LoginModal';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reader');
  const [readerSource, setReaderSource] = useState<ReaderSource | undefined>();
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);

  const goTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={goTo} onOpenLogin={openLogin}>
      {/* El lector se mantiene montado para no perder la lectura al cambiar de pestaña. */}
      <div hidden={activeTab !== 'reader'}>
        <ReaderView source={readerSource} onOpenLogin={openLogin} isActive={activeTab === 'reader'} />
      </div>
      {activeTab === 'ocr' && (
        <OcrUploader
          onOpenLogin={openLogin}
          onTextExtracted={(src) => {
            setReaderSource(src);
            goTo('reader');
          }}
        />
      )}
      {activeTab === 'gamification' && <GamificationBoard onOpenLogin={openLogin} />}
      {activeTab === 'preferences' && <PreferencesPanel />}
      {activeTab === 'educator' && <EducatorPortal />}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </Layout>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  </AuthProvider>
);

export default App;
