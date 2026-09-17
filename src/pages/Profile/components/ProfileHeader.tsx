import { Edit3, Sparkles, User } from 'lucide-react';
import React, { useState } from 'react';
import { Card } from '../../../components/common/Card';

export interface ProfileHeaderProps {
  name: string;
  phoneNumber?: string | null;
  role: string;
  onUpdateName?: (_newName: string) => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
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
    <Card variant="filled" className="space-y-3 bg-m3-surface-container p-4">
      <div className="flex items-center gap-4">
        <div className="shadow-xs flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-m3-primary-container text-lg font-bold text-m3-on-primary-container">
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-m3-on-surface">
              {name}
            </h2>
            {onUpdateName && !isEditing && (
              <button
                onClick={() => {
                  setEditValue(name === phoneNumber ? '' : name);
                  setIsEditing(true);
                }}
                className="rounded-full p-1 text-m3-on-surface-variant hover:bg-m3-surface-container-high"
                title="Edit Name"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {phoneNumber && name !== phoneNumber && (
            <p className="text-[11px] text-m3-on-surface-variant">
              {phoneNumber}
            </p>
          )}

          <div className="mt-1 inline-flex items-center gap-1 rounded bg-m3-primary/10 px-2 py-0.5 text-[10px] font-semibold text-m3-primary">
            <Sparkles className="h-3 w-3" />
            <span>{role}</span>
          </div>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 rounded-lg border border-m3-outline-variant bg-m3-surface px-3 py-1.5 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={isSaving || !editValue.trim()}
            className="rounded-lg bg-m3-primary px-3 py-1.5 text-xs font-semibold text-m3-on-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-lg border border-m3-outline-variant px-2.5 py-1.5 text-xs text-m3-on-surface-variant"
          >
            Cancel
          </button>
        </form>
      )}
    </Card>
  );
};
