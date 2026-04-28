import React, { useState } from 'react';
import styled from 'styled-components';
import { Drawer } from '../../ui/Drawer';
import { Chip } from '../../ui/Chip';
import { RangeSlider } from '../../ui/RangeSlider';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { AlertDialog } from '../../ui/AlertDialog';
import {
  EMOJI_GRID,
  GENDER_OPTIONS,
  MONTHS,
  OCCASION_OPTIONS,
  ADULT_AGE_BUCKETS,
  VIBE_OPTIONS,
  VIBE_DEFAULT_VISIBLE_COUNT,
  daysInMonth,
} from './constants';
import { RELATIONSHIPS } from '../quiz/constants';
import { getInterestEmoji } from '../quiz/ageBasedContent';
import { NEEDS_GENDER_RELATIONSHIPS } from '../quiz/useQuizFlow';
import { ProfileDraft, ProfileSavedHints } from './types';

export interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** True for the "Me" profile — hides the Remove link. */
  isMe?: boolean;
  draft: ProfileDraft;
  /** Per-field saved-hint flash flags. */
  savedHints?: ProfileSavedHints;
  /** Pre-resolved interest pill list (already age + gender aware). */
  interestPills: string[];
  /** Pre-resolved placeholder for the "tell us more" field. */
  freeformPlaceholder: string;
  onChange: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
  onUpdatePicks: () => void;
  /**
   * Disables the "Update picks" CTA. Set when no algo-triggering field has
   * changed since the drawer opened — see `useProfileDrawer.isDirty` and
   * bug #51.
   */
  updatePicksDisabled?: boolean;
  onRemove?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 8px;
  border-bottom: 1px solid ${({ theme }) => theme.color.warmBorder};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  &:hover { background: hsl(var(--muted)); }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  /* Keep wheel/touch scroll contained — don't chain to the underlying page
     when the user reaches the top or bottom of the drawer. */
  overscroll-behavior: contain;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionLabel = styled.h3`
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SavedHint = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.clay};
  letter-spacing: 0;
  text-transform: none;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EmojiPickerButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: ${({ theme }) => theme.color.cream};
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  &:hover { background: #f0eae5; }
`;

const NameInput = styled.input`
  flex: 1;
  font-family: ${({ theme }) => theme.font.serif};
  font-style: italic;
  font-size: 28px;
  line-height: 1.1;
  color: ${({ theme }) => theme.color.clay};
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 4px 0;
  &:focus {
    outline: none;
    border-bottom-color: ${({ theme }) => theme.color.warmBorder};
  }
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  background: ${({ theme }) => theme.color.cream};
  border-radius: 12px;
  padding: 12px;
`;

const EmojiTile = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #ffffff; }
  &:active { transform: scale(0.95); }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ShowMoreLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: 8px;
  font: inherit;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  &:hover { color: hsl(var(--foreground)); }
`;

const RangeWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const Footer = styled.div`
  padding: 16px 20px 24px;
  border-top: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
`;

const RemoveLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: 32px;
  font: inherit;
  font-size: 13px;
  color: hsl(var(--destructive));
  cursor: pointer;
  align-self: flex-start;
  &:hover { opacity: 0.8; }
`;

const XIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Label: React.FC<{ children: React.ReactNode; saved?: boolean; suffix?: React.ReactNode }> = ({
  children,
  saved,
  suffix,
}) => (
  <SectionLabel>
    {children}
    {suffix}
    {saved && <SavedHint>Saved</SavedHint>}
  </SectionLabel>
);

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  open,
  onClose,
  isMe,
  draft,
  savedHints,
  interestPills,
  freeformPlaceholder,
  onChange,
  onUpdatePicks,
  updatePicksDisabled = false,
  onRemove,
}) => {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showAllVibes, setShowAllVibes] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const monthIdx = draft.birthMonth ?? 0;
  const maxDay = daysInMonth(monthIdx);
  const visibleVibes = showAllVibes ? VIBE_OPTIONS : VIBE_OPTIONS.slice(0, VIBE_DEFAULT_VISIBLE_COUNT);

  const toggleListField = <K extends 'interests' | 'vibes'>(field: K, value: string) => {
    const list = draft[field];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    onChange(field, next as ProfileDraft[K]);
  };

  return (
    <Drawer open={open} onClose={onClose} side="right" ariaLabel="Edit profile" width={460}>
      <Container>
        <Header>
          <div style={{ flex: 1 }} />
          <CloseButton type="button" aria-label="Close" onClick={onClose}>
            <XIcon />
          </CloseButton>
        </Header>
        <Body>
          {/* Emoji + Name */}
          <Section>
            <Label saved={savedHints?.emoji || savedHints?.name}>About</Label>
            <NameRow>
              <EmojiPickerButton
                type="button"
                aria-label="Pick emoji"
                onClick={() => setEmojiOpen((v) => !v)}
              >
                {draft.emoji}
              </EmojiPickerButton>
              <NameInput
                value={draft.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Name"
              />
            </NameRow>
            {emojiOpen && (
              <EmojiGrid>
                {EMOJI_GRID.map((e) => (
                  <EmojiTile
                    key={e}
                    type="button"
                    onClick={() => {
                      onChange('emoji', e);
                      setEmojiOpen(false);
                    }}
                    aria-label={`Pick ${e}`}
                  >
                    {e}
                  </EmojiTile>
                ))}
              </EmojiGrid>
            )}
          </Section>

          {/* Birthday */}
          <Section>
            <Label saved={savedHints?.birthMonth || savedHints?.birthDay}>Birthday</Label>
            <TwoCol>
              <Select
                value={draft.birthMonth ? String(draft.birthMonth) : ''}
                onChange={(e) => onChange('birthMonth', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Month"
                options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
              <Select
                value={draft.birthDay ? String(draft.birthDay) : ''}
                onChange={(e) => onChange('birthDay', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Day"
                disabled={!draft.birthMonth}
                options={Array.from({ length: maxDay }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))}
              />
            </TwoCol>
          </Section>

          {/* Price — dual-thumb range; bug #51 mirrors the OLD givethea.com UI */}
          <Section>
            <Label>Price</Label>
            <RangeWrap>
              <RangeSlider
                value={[draft.priceMin ?? 0, draft.priceMax ?? 200]}
                min={0}
                max={200}
                step={10}
                ariaLabelLower="Minimum price"
                ariaLabelUpper="Maximum price"
                onChange={([next_min, next_max]) => {
                  onChange('priceMin', next_min);
                  onChange('priceMax', next_max);
                }}
              />
              <RangeLabels>
                <span>${draft.priceMin ?? 0}</span>
                <span>${draft.priceMax ?? 200}{(draft.priceMax ?? 200) >= 200 ? '+' : ''}</span>
              </RangeLabels>
            </RangeWrap>
          </Section>

          {/* Interests */}
          <Section>
            <Label>Interests</Label>
            <ChipRow>
              {interestPills.map((label) => (
                <Chip
                  key={label}
                  selected={draft.interests.includes(label)}
                  onClick={() => toggleListField('interests', label)}
                >
                  {getInterestEmoji(label, draft.gender)}{label}
                </Chip>
              ))}
            </ChipRow>
          </Section>

          {/* Vibes */}
          <Section>
            <Label>Vibes</Label>
            <ChipRow>
              {visibleVibes.map((label) => (
                <Chip
                  key={label}
                  selected={draft.vibes.includes(label)}
                  onClick={() => toggleListField('vibes', label)}
                >
                  {label}
                </Chip>
              ))}
            </ChipRow>
            <ShowMoreLink type="button" onClick={() => setShowAllVibes((v) => !v)}>
              {showAllVibes ? 'Show fewer' : `Show more (+${VIBE_OPTIONS.length - VIBE_DEFAULT_VISIBLE_COUNT})`}
            </ShowMoreLink>
          </Section>

          {/* Freeform */}
          <Section>
            <Label>Tell us more</Label>
            <Textarea
              value={draft.moreAbout ?? ''}
              onChange={(e) => onChange('moreAbout', e.target.value)}
              placeholder={freeformPlaceholder}
            />
          </Section>

          {/* Gender — only surfaced for ambiguous relationships (Partner /
              Friend / Me! / Other). Unambiguous ones (Mom, Brother, etc.)
              auto-derive gender from the relationship via useProfileDrawer
              and hide the picker, mirroring the quiz's NEEDS_GENDER gating.
              Bug #51 followup. */}
          {NEEDS_GENDER_RELATIONSHIPS.includes(draft.relationship ?? '') && (
            <Section>
              <Label>Gender</Label>
              <Select
                value={draft.gender ?? ''}
                onChange={(e) => onChange('gender', e.target.value as ProfileDraft['gender'])}
                placeholder="Select"
                options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.label}` }))}
              />
            </Section>
          )}

          {/* Relationship */}
          <Section>
            <Label>Relationship</Label>
            <Select
              value={draft.relationship ?? ''}
              onChange={(e) => onChange('relationship', e.target.value)}
              placeholder="Select"
              options={RELATIONSHIPS.map((r) => ({ value: r.value, label: `${r.emoji} ${r.value}` }))}
            />
          </Section>

          {/* Age */}
          <Section>
            <Label>Age</Label>
            <Select
              value={draft.age ? String(draft.age) : ''}
              onChange={(e) => onChange('age', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Select"
              options={ADULT_AGE_BUCKETS.map((b) => ({ value: String(b.value), label: b.label }))}
            />
          </Section>

          {/* Occasion */}
          <Section>
            <Label>Occasion</Label>
            <Select
              value={draft.occasion ?? ''}
              onChange={(e) => onChange('occasion', e.target.value)}
              placeholder="Select"
              options={OCCASION_OPTIONS.map((o) => ({ value: o.value, label: `${o.emoji} ${o.value}` }))}
            />
          </Section>

          {!isMe && onRemove && (
            <RemoveLink type="button" onClick={() => setRemoveConfirmOpen(true)}>
              Remove {draft.name || 'person'} & all their picks
            </RemoveLink>
          )}
        </Body>
        <Footer>
          <Button
            label="Update picks"
            onClick={onUpdatePicks}
            size="md"
            disabled={updatePicksDisabled}
          />
        </Footer>
      </Container>

      <AlertDialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        title={`Remove ${draft.name || 'this person'}?`}
        description="This deletes their saved gifts, purchase history, and quiz answers. Can't be undone."
        primaryAction={{
          label: 'Remove',
          onClick: () => {
            setRemoveConfirmOpen(false);
            onRemove?.();
          },
        }}
        secondaryAction={{ label: 'Cancel', onClick: () => setRemoveConfirmOpen(false) }}
      />
    </Drawer>
  );
};
