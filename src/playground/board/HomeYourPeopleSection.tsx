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

// Homepage section: "Your people". Renders right above the
// ValuePropsCard for ANY user (anon or signed-in) who has at least
// one recipient in the registry. Mirrors the People page tile pattern
// (same PersonTile + AddPersonTile components) so the visual language
// stays consistent across the two surfaces.

const OuterWrap = styled.section`
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 16px 0;
  @media (min-width: 640px) {
    padding: 56px 32px 0;
  }
  @media (min-width: 1024px) {
    padding: 56px 64px 0;
  }
`;

const Heading = styled.h2`
  margin: 0 0 32px 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  text-align: center;
  letter-spacing: -0.01em;
  @media (min-width: 768px) {
    font-size: 40px;
    margin: 0 0 48px 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const HomeYourPeopleSection: React.FC = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  // Re-render on registry change OR activity change so collages stay
  // current as the user likes more items.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  // Only render this section when the user has at least one recipient.
  // A first-time visitor with no boards sees the standard hero +
  // ValuePropsCard flow without the My-people surface intruding.
  if (recipients.length === 0) return null;

  return (
    <OuterWrap aria-label="Your people">
      <Heading>Your people</Heading>
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
              navigate(`/quiz/results/${r.id}/${MOCK_RECOMMENDATION_ID}`)
            }
          />
        ))}
      </Grid>
    </OuterWrap>
  );
};

export default HomeYourPeopleSection;
