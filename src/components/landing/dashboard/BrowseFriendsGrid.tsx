import React from 'react';
import styled, { keyframes } from 'styled-components';
import { PersonTile } from './PersonTile';
import { AddPersonTile } from './AddPersonTile';
import { DashboardPerson } from './types';

export interface BrowseFriendsGridProps {
  /** Already-sorted list. Caller is responsible for "Me" pinning. */
  people: DashboardPerson[];
  /** Per-person preview images (top 4 likes). */
  previews: Record<string, string[]>;
  /** Per-person resolved flag (`true` once first preview snapshot has fired). */
  resolved: Record<string, boolean>;
  /** When true and `people` is empty, render four shimmering skeleton tiles. */
  loading?: boolean;
  meId?: string;
  onPersonClick?: (person: DashboardPerson) => void;
  onAddSomeoneClick?: () => void;
  heading?: string;
}

const HeadingWrap = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 16px 8px;
  @media (min-width: 640px) {
    padding-left: 32px;
    padding-right: 32px;
  }
  @media (min-width: 1024px) {
    padding-left: 64px;
    padding-right: 64px;
  }
`;

const Heading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  @media (min-width: 768px) {
    font-size: 52px;
  }
`;

const Section = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 16px;
  @media (min-width: 640px) {
    padding-left: 32px;
    padding-right: 32px;
  }
  @media (min-width: 1024px) {
    padding: 64px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const skeletonShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonTile = styled.div`
  display: flex;
  flex-direction: column;
`;

const SkeletonFrame = styled.div`
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

const SkeletonLabel = styled.div`
  height: 16px;
  width: 96px;
  margin: 12px auto 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

export const BrowseFriendsGrid: React.FC<BrowseFriendsGridProps> = ({
  people,
  previews,
  resolved,
  loading = false,
  meId,
  onPersonClick,
  onAddSomeoneClick,
  heading = 'Browse my friends',
}) => {
  return (
    <>
      <HeadingWrap>
        <Heading>{heading}</Heading>
      </HeadingWrap>
      <Section aria-label="Your people">
        <Grid>
          {loading && people.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <SkeletonTile key={i}>
                  <SkeletonFrame />
                  <SkeletonLabel />
                </SkeletonTile>
              ))
            : people.map((person) => (
                <PersonTile
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  emoji={person.emoji}
                  isMe={person.id === meId}
                  previewImages={previews[person.id] ?? []}
                  loading={!resolved[person.id]}
                  onClick={() => onPersonClick?.(person)}
                />
              ))}
          <AddPersonTile onClick={onAddSomeoneClick} />
        </Grid>
      </Section>
    </>
  );
};
