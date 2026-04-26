import React from 'react';
import { Chip } from './Chip';

export default {
  title: 'UI/Chip',
  component: Chip,
  parameters: { happo: { targets: ['chrome-large'] } },
};

export const Unselected = {
  args: { children: 'Cozy' },
};

export const Selected = {
  args: { children: 'Cozy', selected: true },
};

export const WithEmoji = {
  args: { children: 'Sweet tooth', leading: '🍰' },
};

export const Disabled = {
  args: { children: 'Cozy', disabled: true },
};

const VIBES = ['Cozy', 'Adventurous', 'Practical', 'Sentimental', 'Foodie', 'Outdoorsy', 'Crafty'];

export const Group = {
  render: () => {
    const [selected, setSelected] = React.useState<Set<string>>(new Set(['Cozy', 'Foodie']));
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 480 }}>
        {VIBES.map((v) => (
          <Chip
            key={v}
            selected={selected.has(v)}
            onClick={() => {
              const next = new Set(selected);
              if (next.has(v)) next.delete(v);
              else next.add(v);
              setSelected(next);
            }}
          >
            {v}
          </Chip>
        ))}
      </div>
    );
  },
};
