import React from 'react';
import { ProfileDrawer } from './ProfileDrawer';
import { useProfileDrawer } from './useProfileDrawer';
import { ProfileDraft } from './types';

export interface ProfileDrawerControlledProps {
  initial: ProfileDraft;
  isMe?: boolean;
  interestPills: string[];
  freeformPlaceholder: string;
  externalOpenSignal?: number;
  onCommit?: (next: ProfileDraft) => void;
  onRemove?: () => void;
}

/** Story-only convenience container that wires `useProfileDrawer` to
 *  `ProfileDrawer` and exposes an `externalOpenSignal` so a parent button
 *  can trigger open via state-bump. */
export const ProfileDrawerControlled: React.FC<ProfileDrawerControlledProps> = ({
  initial,
  isMe,
  interestPills,
  freeformPlaceholder,
  externalOpenSignal,
  onCommit,
  onRemove,
}) => {
  const ctl = useProfileDrawer({ initial, onCommit });

  React.useEffect(() => {
    if (externalOpenSignal === undefined) return;
    if (externalOpenSignal > 0) ctl.openDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenSignal]);

  return (
    <ProfileDrawer
      open={ctl.open}
      onClose={ctl.closeDrawer}
      isMe={isMe}
      draft={ctl.draft}
      savedHints={ctl.savedHints}
      interestPills={interestPills}
      freeformPlaceholder={freeformPlaceholder}
      onChange={ctl.setField}
      onUpdatePicks={ctl.commit}
      onRemove={onRemove}
    />
  );
};
