import React from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';

export default {
  title: 'UI/Drawer',
  component: Drawer,
};

const fillerStyle: React.CSSProperties = {
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

export const RightOpen = {
  render: () => (
    <Drawer open onClose={() => {}} side="right" ariaLabel="Right drawer demo">
      <div style={fillerStyle}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Right drawer</h2>
        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
          Slides in from the right. 420px wide on desktop, full-width on narrow viewports.
        </p>
      </div>
    </Drawer>
  ),
};

export const BottomOpen = {
  render: () => (
    <Drawer open onClose={() => {}} side="bottom" ariaLabel="Bottom drawer demo">
      <div style={fillerStyle}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Bottom sheet</h2>
        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
          Slides up from the bottom. Used for SavePromptSheet.
        </p>
      </div>
    </Drawer>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [side, setSide] = React.useState<'right' | 'bottom' | null>(null);
    return (
      <div style={{ padding: 32, display: 'flex', gap: 8 }}>
        <Button label="Open right" onClick={() => setSide('right')} />
        <Button label="Open bottom" variant="ghost" onClick={() => setSide('bottom')} />
        <Drawer
          open={side !== null}
          onClose={() => setSide(null)}
          side={side ?? 'right'}
          ariaLabel="Live drawer"
        >
          <div style={fillerStyle}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Drawer ({side})</h2>
            <Button label="Close" variant="ghost" onClick={() => setSide(null)} />
          </div>
        </Drawer>
      </div>
    );
  },
};
