import React, { useState } from 'react';
import styled from 'styled-components';
import { BrowseFriendsPage } from './BrowseFriendsPage';
import { useAuthState } from './useAuthState';
import { useDashboard } from './useDashboard';
import { useFriendPreviews } from './useFriendPreviews';
import { PLACEHOLDER_SEGMENTS, makeFilledSegment } from './constants';
import {
  AuthAdapter,
  DashboardPerson,
  FriendPreviewLoader,
  ME_TILE_ID,
  QuestPillSegmentKey,
  QuestPillSegments,
} from './types';

export interface BrowseFriendsPageAnimatedProps {
  authAdapter: AuthAdapter;
  previewLoader: FriendPreviewLoader;
  /** Already-sorted; "Me" pinning is the caller's responsibility. */
  people: DashboardPerson[];
  meId?: string;
  onAddSomeoneClick?: () => void;
  onPersonClick?: (person: DashboardPerson) => void;
  onSparkle?: () => void;
}

interface PillDraft {
  who: string | null;
  what: string | null;
  likes: string | null;
}

const RELATIONSHIP_OPTIONS = ['Mom', 'Dad', 'Brother', 'Sister', 'Partner', 'Friend'];
const OCCASION_OPTIONS = ['Birthday', 'Anniversary', 'Holiday', 'Just because', 'Wedding'];
const INTEREST_OPTIONS = ['Cooking', 'Travel', 'Books', 'Wellness', 'Music', 'Outdoors'];

const DropdownPanel = styled.div`
  padding: 24px;
  border-radius: 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`;

const DropdownTitle = styled.p`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ChipButton = styled.button<{ $selected: boolean }>`
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid ${({ $selected }) => ($selected ? 'hsl(var(--foreground))' : 'hsl(var(--border))')};
  background: ${({ $selected }) => ($selected ? 'hsl(var(--foreground))' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'hsl(var(--background))' : 'hsl(var(--foreground))')};
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;
  &:hover {
    transform: translateY(-1px);
  }
`;

function buildSegments(draft: PillDraft): QuestPillSegments {
  return [
    draft.who ? makeFilledSegment('who', draft.who) : PLACEHOLDER_SEGMENTS[0],
    draft.what ? makeFilledSegment('what', draft.what) : PLACEHOLDER_SEGMENTS[1],
    draft.likes ? makeFilledSegment('likes', draft.likes) : PLACEHOLDER_SEGMENTS[2],
  ];
}

/**
 * Story-only Live container. Wires `useAuthState` + `useDashboard` +
 * `useFriendPreviews` and forwards the View props. Production callers
 * will replace this with their own container that talks to Firebase.
 *
 * Interactivity wired here:
 *  - pill segments open/close, with a content dropdown that lets the user
 *    pick a relationship / occasion / interest; selection updates the
 *    segment value and visibly fills the pill.
 *  - the X button on a filled segment clears it.
 *  - sparkle button fires `onSparkle` and bumps the pulse key.
 *  - tile clicks + Add-someone click forward to props.
 */
export const BrowseFriendsPageAnimated: React.FC<BrowseFriendsPageAnimatedProps> = ({
  authAdapter,
  previewLoader,
  people,
  meId = ME_TILE_ID,
  onAddSomeoneClick,
  onPersonClick,
  onSparkle,
}) => {
  const authState = useAuthState(authAdapter);
  const dashboard = useDashboard({ onSparkle });
  const [draft, setDraft] = useState<PillDraft>({ who: null, what: null, likes: null });

  const { previews, resolved } = useFriendPreviews(authState, people, previewLoader);

  const segments = buildSegments(draft);
  const canSearch = Boolean(draft.who && draft.what && draft.likes);

  const setSegmentValue = (key: QuestPillSegmentKey, value: string | null) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const renderDropdown = () => {
    if (!dashboard.openSegment) return null;
    const config: Record<QuestPillSegmentKey, { title: string; options: string[] }> = {
      who: { title: 'Who are you shopping for?', options: RELATIONSHIP_OPTIONS },
      what: { title: "What's the occasion?", options: OCCASION_OPTIONS },
      likes: { title: 'What do they like?', options: INTEREST_OPTIONS },
    };
    const cfg = config[dashboard.openSegment];
    const selected = draft[dashboard.openSegment];
    return (
      <DropdownPanel>
        <DropdownTitle>{cfg.title}</DropdownTitle>
        <ChipRow>
          {cfg.options.map((opt) => (
            <ChipButton
              key={opt}
              type="button"
              $selected={selected === opt}
              onClick={() => {
                setSegmentValue(dashboard.openSegment as QuestPillSegmentKey, opt);
                dashboard.closeSegments();
              }}
            >
              {opt}
            </ChipButton>
          ))}
        </ChipRow>
      </DropdownPanel>
    );
  };

  return (
    <BrowseFriendsPage
      authState={authState}
      stickyPill={false}
      pill={{
        segments,
        openSegment: dashboard.openSegment,
        onSegmentClick: dashboard.toggleSegment,
        onClearSegment: (key) => setSegmentValue(key, null),
        onSparkleClick: dashboard.triggerSparkle,
        canSearch,
        dropdown: renderDropdown(),
      }}
      grid={{
        people,
        previews,
        resolved,
        meId,
        onPersonClick,
        onAddSomeoneClick,
      }}
    />
  );
};
