import React from 'react';
import { AddPersonTile } from './AddPersonTile';

export default {
  title: 'Landing/Dashboard/AddPersonTile',
  component: AddPersonTile,
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 220, padding: 16 }}>{children}</div>
);

export const Default = {
  render: () => (
    <Frame>
      <AddPersonTile />
    </Frame>
  ),
};

export const CustomLabel = {
  render: () => (
    <Frame>
      <AddPersonTile label="Add a friend" />
    </Frame>
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <div style={{ width: 160, padding: 12 }}>
      <AddPersonTile />
    </div>
  ),
};
