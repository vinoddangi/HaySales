import { AlertTriangle, ArrowRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex } from '../layout/Flex';
import { Text } from './Text';

export interface BackupWarningBannerProps {
  currentYear: number;
  isFormBanner?: boolean;
}

export const BackupWarningBanner: React.FC<BackupWarningBannerProps> = ({
  currentYear,
  isFormBanner = false,
}) => {
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const handleNavigate = () => {
    if (navigate) {
      navigate('/profile');
    } else {
      window.location.hash = '#/profile';
    }
  };

  return (
    <div className="animate-fade-in rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-left">
      <Flex align="start" gap="sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-1">
          <Text
            styleAs="body-sm"
            sentiment="warning"
            weight="bold"
            className="block"
          >
            {isFormBanner
              ? `Annual Backup Required for ${currentYear}`
              : 'Pending Previous Year Records Detected'}
          </Text>
          <Text
            styleAs="caption"
            appearance="secondary"
            className="block leading-relaxed"
          >
            {isFormBanner
              ? `You have unbacked transactions/purchases from previous year(s). To record entries for ${currentYear}, please run the Annual Backup first in Profile. (You can still select a previous year date to log backdated records).`
              : `Active previous year transactions & purchases have not been backed up yet. Please complete any backdated records, then perform the Annual Backup in Profile before recording ${currentYear} entries.`}
          </Text>
          <button
            type="button"
            onClick={handleNavigate}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <span>Go to Profile & Take Backup</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Flex>
    </div>
  );
};
