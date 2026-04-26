import React from 'react';
import { DropdownMenu } from './DropdownMenu';
import { Button } from './Button';

export default {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  parameters: { happo: { targets: ['chrome-large'] } },
};

const items = [
  { key: 'mark', label: 'Mark as purchased', onClick: () => {} },
  { key: 'remove', label: 'Remove from list', onClick: () => {} },
];

export const Closed = {
  render: () => (
    <div style={{ padding: 32 }}>
      <DropdownMenu
        items={items}
        trigger={({ onClick, ...rest }) => (
          <Button label="More actions" variant="ghost" onClick={onClick} {...rest} />
        )}
      />
    </div>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => (
    <div style={{ padding: 32 }}>
      <DropdownMenu
        items={items}
        trigger={({ onClick, ...rest }) => (
          <Button label="More actions" variant="ghost" onClick={onClick} {...rest} />
        )}
      />
    </div>
  ),
};
