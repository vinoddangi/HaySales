import { AlertTriangle, ArrowRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex } from '../layout/Flex';
import { Text } from './Text';

export interface RolloutWarningBannerProps {
  lastRolledOutMonth?: string;
  isFormBanner?: boolean;
}

export const RolloutWarningBanner: React.FC<RolloutWarningBannerProps> = ({
  lastRolledOutMonth,
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
              ? 'Monthly Rollout Required'
              : 'Pending Monthly Rollout Detected'}
          </Text>
          <Text
            styleAs="caption"
            appearance="secondary"
            className="block leading-relaxed"
          >
            {isFormBanner
              ? `Prior month(s) have not been rolled out yet (Last closed month: ${lastRolledOutMonth || 'None'}). Please complete the Monthly Rollout in Profile before recording entries for this date.`
              : `Monthly accounts have not been rolled forward. Please run the Monthly Rollout in Profile to close previous months.`}
          </Text>
          <button
            type="button"
            onClick={handleNavigate}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <span>Go to Profile & Rollout Month</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Flex>
    </div>
  );
};
