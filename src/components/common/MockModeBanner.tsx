import { FlaskConical, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { mockDataStore } from '../../mock/mockDataStore';

export const MockModeBanner: React.FC = () => {
  const [isMock, setIsMock] = useState(mockDataStore.isEnabled());

  useEffect(() => {
    const handleMockChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsMock(customEvent.detail ?? mockDataStore.isEnabled());
    };

    window.addEventListener('haysales_mock_mode_changed', handleMockChange);
    return () => {
      window.removeEventListener(
        'haysales_mock_mode_changed',
        handleMockChange,
      );
    };
  }, []);

  if (!isMock) return null;

  const handleExitMock = () => {
    mockDataStore.setEnabled(false);
    setIsMock(false);
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs text-amber-900 backdrop-blur-md dark:text-amber-200">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold">
          Mock / Offline Sandbox Mode Active • Using Local CSV Data
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleExitMock}
          className="rounded-md bg-amber-600 px-2 py-0.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-amber-500 dark:text-black"
        >
          Exit Mock Mode
        </button>
        <button
          onClick={() => setIsMock(false)}
          className="p-0.5 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-white"
          title="Dismiss Banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
