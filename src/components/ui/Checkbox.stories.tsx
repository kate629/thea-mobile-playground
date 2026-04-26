import React from 'react';
import { Checkbox } from './Checkbox';

export default {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: { happo: { targets: ['chrome-large'] } },
};

export const Unchecked = {
  args: { label: 'Send me reminders' },
};

export const Checked = {
  args: { label: 'Send me reminders', checked: true },
};

export const Disabled = {
  args: { label: 'Send me reminders', disabled: true },
};

export const Invalid = {
  args: { label: 'Required field', 'aria-invalid': true },
};
