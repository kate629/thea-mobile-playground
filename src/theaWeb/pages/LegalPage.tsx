import React from 'react';
import styled from 'styled-components';

import { SiteHeader } from '../../components/landing/SiteHeader';
import { Footer } from '../../components/landing/marketing/Footer';

export interface LegalPageProps {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}

const Page = styled.div`
  min-height: 100vh;
  background: hsl(var(--background));
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1 0 auto;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
  line-height: 1.6;

  @media (min-width: 768px) {
    padding: 40px 32px 64px;
  }

  h1 {
    font-family: ${({ theme }) => theme.font.serif};
    font-size: 32px;
    margin: 0 0 8px;
    color: hsl(var(--primary));
  }

  h2 {
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 18px;
    font-weight: 600;
    margin: 28px 0 8px;
  }

  p, li {
    font-size: 15px;
  }

  ul {
    padding-left: 20px;
    margin: 8px 0;
  }
`;

const EffectiveDate = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  margin: 0 0 16px;
`;

export const LegalPage: React.FC<LegalPageProps> = ({ title, effectiveDate, children }) => (
  <Page>
    <SiteHeader />
    <Main>
      <h1>{title}</h1>
      <EffectiveDate>Effective Date: {effectiveDate}</EffectiveDate>
      {children}
    </Main>
    <Footer />
  </Page>
);
