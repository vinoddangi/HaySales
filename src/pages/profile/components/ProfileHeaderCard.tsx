import React, { useState } from 'react';
import { Avatar, Card, FlexLayout, Pill, Text } from '@salt-ds/core';
import { Edit3, Sparkles } from 'lucide-react';

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

  return (
    <Card className="profile-header-card">
      <FlexLayout align="center" gap={1.5} style={{ width: '100%' }}>
        <Avatar name={name || 'Vinod Dangi'} size={2} />
        <div className="profile-header__info">
          <FlexLayout align="center" gap={0.5}>
            <Text styleAs="h3">
              <b>{name}</b>
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
                <Edit3 size={14} />
              </button>
            )}
          </FlexLayout>

          {phoneNumber && name !== phoneNumber && (
            <Text
              styleAs="notation"
              color="secondary"
              className="profile-header__phone"
            >
              {phoneNumber}
            </Text>
          )}

          <Pill style={{ marginTop: '4px' }}>
            <FlexLayout align="center" gap={0.5}>
              <Sparkles size={12} />
              <span>{role}</span>
            </FlexLayout>
          </Pill>
        </div>
      </FlexLayout>

      {isEditing && (
        <form
          onSubmit={handleSave}
          className="profile-header__form"
          style={{ marginTop: '12px' }}
        >
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
    </Card>
  );
};

export default ProfileHeaderCard;
