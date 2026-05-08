import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import type { RecipientAccent } from './recipientAccent';

// Thumbnail size — kept in sync with THUMB_SIZE_PX in useFlightAnimation so
// the flying clone lands at the right scale.
const THUMB_SIZE = 132;

const Panel = styled.div`
  background: transparent;
  /* Tighter vertical padding so the slimmer collapsed sheet (snap 0.78)
     can fit the header + dotted empty-slot without clipping. */
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

// Italic gray "edit" affordance shown below the title in the expanded
// grid layout only. Tap → enters inline-edit mode where the recipient
// name + emoji can be edited in place. Doesn't re-trigger search.
const EditLink = styled.button`
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  font-style: italic;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  &:hover { color: hsl(var(--foreground)); }
`;

const EditRow = styled.form`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
`;

const EditPrefix = styled.span`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
`;

const EmojiInput = styled.input`
  width: 36px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  background: transparent;
  border: none;
  border-bottom: 1px dashed hsl(var(--border));
  padding: 0 2px 2px;
  color: hsl(var(--foreground));
  &:focus {
    outline: none;
    border-bottom-color: hsl(var(--primary));
  }
`;

const NameInput = styled.input`
  min-width: 80px;
  max-width: 200px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-bottom: 1px dashed hsl(var(--border));
  padding: 0 4px 2px;
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
  &:focus {
    outline: none;
    border-bottom-color: hsl(var(--primary));
  }
`;

// Matches the Mom-anchor style in BoardHeader: sans-serif, weight 600,
// 22px, NOT italic. Centered in the saved tray. Reads as a real section
// heading — same typographic register as the recipient name above.
const Label = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
  line-height: 1.1;
`;

// ─── Row layout (default snap) ────────────────────────────────────────
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  padding: 4px 2px 8px;
`;

// ─── Grid layout (expanded snap) ──────────────────────────────────────
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
  padding: 4px 2px 80px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const GridCard = styled.button<{ $accentSoft: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  transition: transform 150ms ease;
  &:active { transform: scale(0.98); }
`;

// Tiny X overlay for removing an item from saves. Lives on each grid
// card in the expanded layout only (not the row carousel — too cramped).
// Stops propagation so the parent card click (which opens the product)
// doesn't fire when the user actually wants to remove.
const RemoveButton = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: #ffffff; }
  &:active { transform: scale(0.92); }
`;

const RemoveIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GridImage = styled.div<{ $accentSoft: string }>`
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 14px;
  overflow: hidden;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 4px 12px ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.25)')};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const GridMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
`;

const GridTitle = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const GridBrand = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const GridPrice = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
`;

// ─── Thumbnail (row layout) ───────────────────────────────────────────
// Save-landing animation: just a gentle scale wobble. The earlier halo
// pulse read as a "pink flash" and was visually loud — pulled it.
const wobble = keyframes`
  0%   { transform: scale(1); }
  35%  { transform: scale(1.06); }
  70%  { transform: scale(0.98); }
  100% { transform: scale(1); }
`;

const Thumb = styled.button<{ $accentSoft: string; $fresh: boolean }>`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
  padding: 0;
  cursor: pointer;
  transition: transform 150ms ease;
  box-shadow: 0 6px 16px ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.30)')};

  ${({ $fresh }) =>
    $fresh &&
    css`
      animation: ${wobble} 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
    `}

  &:active { transform: scale(0.96); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

// Empty-state slot — sized smaller than a real saved thumbnail so it
// fits inside the slimmer collapsed sheet (snap default 0.78) without
// being clipped top + bottom. The hint text next to it carries most of
// the visual weight; the square is just an affordance for "saves
// land here."
const EMPTY_SLOT_SIZE = 60;
const EmptySlot = styled.div<{ $accentSoft: string }>`
  flex: 0 0 auto;
  width: ${EMPTY_SLOT_SIZE}px;
  height: ${EMPTY_SLOT_SIZE}px;
  border-radius: 14px;
  border: 1.5px dashed ${({ $accentSoft }) => $accentSoft};
  background: transparent;
`;

const EmptyHint = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  flex: 1;
  min-width: 0;
`;

interface BoardSavedPanelProps {
  recipientName: string;
  /** Recipient's current emoji — shown as the prefix to the name input
   *  when the user enters edit mode. */
  recipientEmoji?: string;
  items: ResultsProductCardItem[];
  accent: RecipientAccent;
  /** Layout mode: 'row' for default snap (horizontal carousel of thumbs)
   *  or 'grid' for expanded snap (2-col grid with title/brand/price). */
  layout?: 'row' | 'grid';
  onItemClick?: (item: ResultsProductCardItem) => void;
  /** Removes an item from saves. Wired to the same toggle the heart calls
   *  on the feed — passing the item un-saves it. Only rendered in the
   *  expanded grid layout. */
  onRemove?: (item: ResultsProductCardItem) => void;
  /** Renames the recipient (display only — does NOT re-trigger search).
   *  When provided, an italic "edit" link appears under the title in the
   *  expanded layout. Tap → inline edit emoji + name. */
  onRename?: (newName: string, newEmoji: string) => void;
}

export const BoardSavedPanel = forwardRef<HTMLDivElement, BoardSavedPanelProps>(
  (
    {
      recipientName,
      recipientEmoji,
      items,
      accent,
      layout = 'row',
      onItemClick,
      onRemove,
      onRename,
    },
    ref,
  ) => {
    const [freshId, setFreshId] = useState<string | null>(null);
    const prevFirstIdRef = useRef<string | null>(null);
    const prevCountRef = useRef<number>(items.length);

    // Inline rename state. `editing` = the form is shown; the local
    // values are seeded from props on entry and cleared on commit/cancel.
    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(recipientName);
    const [draftEmoji, setDraftEmoji] = useState(recipientEmoji ?? '');
    const nameInputRef = useRef<HTMLInputElement | null>(null);

    useLayoutEffect(() => {
      if (editing) nameInputRef.current?.focus();
    }, [editing]);

    const enterEdit = () => {
      setDraftName(recipientName);
      setDraftEmoji(recipientEmoji ?? '');
      setEditing(true);
    };

    const commitEdit = () => {
      if (!editing) return;
      onRename?.(draftName, draftEmoji);
      setEditing(false);
    };

    const cancelEdit = () => {
      setDraftName(recipientName);
      setDraftEmoji(recipientEmoji ?? '');
      setEditing(false);
    };

    useEffect(() => {
      const newFirstId = items[0]?.id ?? null;
      if (
        newFirstId &&
        newFirstId !== prevFirstIdRef.current &&
        items.length > prevCountRef.current
      ) {
        setFreshId(newFirstId);
        const t = window.setTimeout(() => setFreshId(null), 720);
        prevFirstIdRef.current = newFirstId;
        prevCountRef.current = items.length;
        return () => window.clearTimeout(t);
      }
      prevFirstIdRef.current = newFirstId;
      prevCountRef.current = items.length;
    }, [items]);

    return (
      <Panel ref={ref} data-saved-panel>
        <Header>
          {editing ? (
            <EditRow
              onSubmit={(e) => {
                e.preventDefault();
                commitEdit();
              }}
            >
              <EditPrefix>Liked for</EditPrefix>
              <EmojiInput
                value={draftEmoji}
                onChange={(e) => setDraftEmoji(e.target.value)}
                aria-label="Recipient emoji"
                inputMode="text"
                autoCapitalize="off"
                autoCorrect="off"
                maxLength={4}
              />
              <NameInput
                ref={nameInputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEdit();
                }}
                aria-label="Recipient name"
                maxLength={40}
              />
            </EditRow>
          ) : (
            <>
              <Label>Liked for {recipientName}</Label>
              {onRename && (
                <EditLink
                  type="button"
                  aria-label={`Edit ${recipientName}'s name and emoji`}
                  // Stop propagation so tapping "edit" inside a collapsed
                  // sheet enters rename mode instead of expanding the
                  // sheet (the parent's tap-to-expand fires on bubbled
                  // clicks).
                  onClick={(e) => {
                    e.stopPropagation();
                    enterEdit();
                  }}
                >
                  Edit name
                </EditLink>
              )}
            </>
          )}
        </Header>
        {layout === 'grid' ? (
          items.length === 0 ? (
            <Row>
              <EmptySlot $accentSoft={accent.soft} />
              <EmptyHint>Like items to add to {recipientName}'s board</EmptyHint>
            </Row>
          ) : (
            <Grid>
              {items.map((item) => (
                <GridCard
                  key={item.id}
                  type="button"
                  aria-label={`Open ${item.title}`}
                  onClick={() => onItemClick?.(item)}
                  $accentSoft={accent.soft}
                  data-saved-thumb-id={item.id}
                >
                  {onRemove && (
                    <RemoveButton
                      role="button"
                      aria-label={`Remove ${item.title} from liked`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                      }}
                    >
                      <RemoveIcon />
                    </RemoveButton>
                  )}
                  <GridImage $accentSoft={accent.soft}>
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  </GridImage>
                  <GridMeta>
                    <GridTitle>{item.title}</GridTitle>
                    {item.brand && <GridBrand>{item.brand}</GridBrand>}
                    {item.price != null && <GridPrice>${Math.round(item.price)}</GridPrice>}
                  </GridMeta>
                </GridCard>
              ))}
            </Grid>
          )
        ) : (
          <Row>
            {items.length === 0 ? (
              <>
                <EmptySlot $accentSoft={accent.soft} />
                <EmptyHint>Like items to add to {recipientName}'s board</EmptyHint>
              </>
            ) : (
              items.map((item) => (
                <Thumb
                  key={item.id}
                  type="button"
                  aria-label={`Open ${item.title}`}
                  onClick={() => onItemClick?.(item)}
                  data-saved-thumb-id={item.id}
                  $accentSoft={accent.soft}
                  $fresh={freshId === item.id}
                >
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                </Thumb>
              ))
            )}
          </Row>
        )}
      </Panel>
    );
  },
);
BoardSavedPanel.displayName = 'BoardSavedPanel';
