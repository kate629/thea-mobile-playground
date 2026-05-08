import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PersonTile } from '../../components/landing/dashboard/PersonTile';
import { AddPersonTile } from '../../components/landing/dashboard/AddPersonTile';
import {
  readRecipients,
  readSavedImagesByRecipient,
  subscribeRecipients,
} from '../mockData/recipientRegistry';
import { subscribeMockActivity } from '../mockData/giftActivityStore';
import { MOCK_RECOMMENDATION_ID } from '../mockData/playgroundConfig';

// Mobile-first People surface. Tap the avatar in any board header → land
// here. Each tile shows up to 4 saved-item images for that recipient,
// falling back to the recipient emoji when nothing has been saved yet.
// Tapping a tile navigates to /board/<recipientId>, which redirects to
// the most recent recommendation for that person.

const Page = styled.div`
  min-height: 100dvh;
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.header`
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 8px;
`;

const BackButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
  color: hsl(var(--foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.96); }
`;

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  text-align: center;
  letter-spacing: -0.01em;
`;

const Body = styled.section`
  flex: 1;
  padding: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }
`;

const ArrowLeft: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const PeoplePage: React.FC = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  // Re-render when either the registry or any save changes — saves
  // change tile preview collages even when the registry itself is stable.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const off1 = subscribeRecipients(bump);
    const off2 = subscribeMockActivity(bump);
    return () => {
      off1();
      off2();
    };
  }, []);

  const recipients = React.useMemo(
    () => readRecipients(),
    // tick forces re-read whenever the stores emit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  return (
    <Page>
      <TopBar>
        <BackButton type="button" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </BackButton>
        <Title>Your people</Title>
        <span aria-hidden />
      </TopBar>
      <Body>
        <Grid>
          <AddPersonTile onClick={() => navigate('/quiz')} />
          {recipients.map((r) => (
            <PersonTile
              key={r.id}
              id={r.id}
              name={r.name}
              emoji={r.emoji}
              previewImages={readSavedImagesByRecipient(r.id, 4)}
              loading={false}
              onClick={() =>
                // Bypass /board redirect — playground has no per-recipient
                // Firestore docs to look up. Mock recommendation hook
                // returns the registry-aware fixture for any recipientId.
                navigate(`/quiz/results/${r.id}/${MOCK_RECOMMENDATION_ID}`)
              }
            />
          ))}
        </Grid>
      </Body>
    </Page>
  );
};

export default PeoplePage;
