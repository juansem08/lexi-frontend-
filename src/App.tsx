import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Layout, type ActiveTab } from './components/Layout';
import { ReaderView } from './components/ReaderView';
import { OcrUploader } from './components/OcrUploader';
import { GamificationBoard } from './components/GamificationBoard';
import { PreferencesPanel } from './components/PreferencesPanel';
import { EducatorPortal } from './components/EducatorPortal';
import { LoginModal } from './components/LoginModal';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reader');
  const [readerInitialText, setReaderInitialText] = useState<string | undefined>();
  const [readerDocumentId, setReaderDocumentId] = useState<string | undefined>();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleTextExtracted = (text: string, documentId: string) => {
    setReaderInitialText(text);
    setReaderDocumentId(documentId);
    setActiveTab('reader');
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'reader' && (
        <ReaderView
          initialText={readerInitialText}
          documentId={readerDocumentId}
        />
      )}

      {activeTab === 'ocr' && (
        <OcrUploader onTextExtracted={handleTextExtracted} />
      )}

      {activeTab === 'gamification' && (
        <GamificationBoard onOpenLogin={() => setIsLoginModalOpen(true)} />
      )}

      {activeTab === 'preferences' && <PreferencesPanel />}

      {activeTab === 'educator' && <EducatorPortal />}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
};

export default App;
