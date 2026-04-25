import React from 'react';
import { Input } from './Input';

export default {
  title: 'UI/Input',
  component: Input,
};

const wrapStyle: React.CSSProperties = { width: 320 };

export const Default = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div style={wrapStyle}><Input {...args} /></div>
  ),
  args: { placeholder: 'Enter your name' },
};

export const WithValue = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div style={wrapStyle}><Input {...args} /></div>
  ),
  args: { defaultValue: 'Manuel' },
};

export const Email = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div style={wrapStyle}><Input {...args} /></div>
  ),
  args: { type: 'email', placeholder: 'you@example.com' },
};

export const Invalid = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div style={wrapStyle}><Input {...args} /></div>
  ),
  args: { defaultValue: 'not-an-email', invalid: true, type: 'email' },
};

export const Disabled = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div style={wrapStyle}><Input {...args} /></div>
  ),
  args: { defaultValue: 'Read-only value', disabled: true },
};
