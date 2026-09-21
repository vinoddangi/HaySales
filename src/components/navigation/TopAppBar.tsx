import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setSearchQuery,
  showSnackbar,
  toggleSearch,
} from '../../store/slices/uiSlice';
import { Text } from '../common/Text';
import { Flex } from '../layout/Flex';

export interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'HaySales M3',
  showBack = false,
  actions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isSearchOpen, searchQuery } = useAppSelector((state) => state.ui);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(
    auth.currentUser,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const isDetailPage =
    location.pathname.startsWith('/item/') ||
    location.pathname === '/profile' ||
    location.pathname === '/customers';

  const avatarInitial = currentUser?.displayName
    ? currentUser.displayName.trim().charAt(0).toUpperCase()
    : 'V';

  return (
    <header className="pt-safe sticky top-0 z-40 w-full border-b border-m3-outline-variant/30 bg-m3-surface/90 backdrop-blur-md transition-colors">
      <Flex
        align="center"
        justify="between"
        gap="sm"
        paddingHorizontal="md"
        className="h-14"
      >
        {isSearchOpen ? (
          <Flex align="center" gap="sm" fullWidth className="animate-fade-in">
            <Search className="ml-2 h-5 w-5 shrink-0 text-m3-on-surface-variant" />
            <input
              type="text"
              autoFocus
              placeholder="Search hay bales, feed, forage..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="flex-1 bg-transparent text-sm text-m3-on-surface placeholder:text-m3-on-surface-variant/60 focus:outline-none"
            />
            <button
              onClick={() => dispatch(toggleSearch())}
              className="rounded-full p-2 text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest"
            >
              <X className="h-5 w-5" />
            </button>
          </Flex>
        ) : (
          <>
            {/* Left Nav Button / Avatar */}
            <Flex align="center" gap="sm">
              {showBack || isDetailPage ? (
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go Back"
                  className="rounded-full p-2 text-m3-on-surface transition-colors hover:bg-m3-surface-container-highest active:bg-m3-surface-container-highest/80"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/profile')}
                  aria-label="User Profile"
                  title="Profile & Settings"
                  className="shadow-xs flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-m3-primary-container text-xs font-bold text-m3-on-primary-container ring-1 ring-m3-outline-variant/40 transition-transform hover:scale-105 active:scale-95"
                >
                  <span>{avatarInitial}</span>
                </button>
              )}
              <Text
                as="h1"
                styleAs="h3"
                appearance="primary"
                weight="semibold"
                className="truncate"
              >
                {title}
              </Text>
            </Flex>

            {/* Right Action Icons */}
            <Flex align="center" gap="xs">
              {actions ? (
                actions
              ) : (
                <>
                  <button
                    onClick={() => dispatch(toggleSearch())}
                    aria-label="Search"
                    className="rounded-full p-2.5 text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      navigate('/activity');
                      dispatch(
                        showSnackbar({
                          message: 'Viewing recent updates & orders',
                        }),
                      );
                    }}
                    aria-label="Notifications"
                    className="relative rounded-full p-2.5 text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-m3-error" />
                  </button>
                </>
              )}
            </Flex>
          </>
        )}
      </Flex>
    </header>
  );
};
