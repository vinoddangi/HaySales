import React, { useState } from 'react';
import { Card, Flex, IconEdit3, IconSparkles, Text } from '../../../components';

export interface ProfileHeaderCardProps {
  name: string;
  phoneNumber?: string | null;
  role: string;
  onUpdateName?: (_newName: string) => Promise<void>;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  name,
  phoneNumber,
  role,
  onUpdateName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editValue.trim() || !onUpdateName) return;
    try {
      setIsSaving(true);
      await onUpdateName(editValue.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'V';

  return (
    <Card variant="filled" className="profile-header-card">
      <Card.Content>
        <Flex align="center" gap="md" fullWidth>
          <div className="profile-header__avatar">
            <Text variant="title-lg" weight="bold" as="span">
              {initial}
            </Text>
          </div>
          <div className="profile-header__info">
            <Flex align="center" gap="xs">
              <Text
                variant="title-md"
                appearance="primary"
                weight="bold"
                className="profile-header__name"
              >
                {name}
              </Text>
              {onUpdateName && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(name === phoneNumber ? '' : name);
                    setIsEditing(true);
                  }}
                  className="profile-header__edit-btn"
                  title="Edit Name"
                  aria-label="Edit Name"
                >
                  <IconEdit3 size="sm" />
                </button>
              )}
            </Flex>

            {phoneNumber && name !== phoneNumber && (
              <Text
                variant="caption"
                appearance="secondary"
                className="profile-header__phone"
              >
                {phoneNumber}
              </Text>
            )}

            <div className="profile-header__badge">
              <IconSparkles size="xs" />
              <Text variant="caption" weight="bold" as="span">
                {role}
              </Text>
            </div>
          </div>
        </Flex>

        {isEditing && (
          <form onSubmit={handleSave} className="profile-header__form">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter your name"
              className="profile-header__input"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSaving || !editValue.trim()}
              className="profile-header__save-btn"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="profile-header__cancel-btn"
            >
              Cancel
            </button>
          </form>
        )}
      </Card.Content>
    </Card>
  );
};

export default ProfileHeaderCard;
