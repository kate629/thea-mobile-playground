import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { fadeIn } from '../../animations';

export interface DropdownMenuItem {
  key: string;
  label: string;
  /** Optional emoji or icon node rendered before the label. */
  leading?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** The trigger element. Receives onClick + ref so the menu can anchor under it. */
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': true }) => React.ReactNode;
  items: DropdownMenuItem[];
  /** Where to anchor the menu relative to the trigger. Defaults to bottom-end. */
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  /** Notify host (used by parent cards to suppress hover effects while open). */
  onOpenChange?: (open: boolean) => void;
}

const Wrap = styled.div`
  position: relative;
  display: inline-block;
`;

const Menu = styled.ul<{ $align: 'start' | 'end'; $side: 'top' | 'bottom' }>`
  list-style: none;
  margin: 0;
  padding: 4px;
  position: absolute;
  ${({ $side }) => ($side === 'bottom' ? 'top: calc(100% + 6px);' : 'bottom: calc(100% + 6px);')}
  ${({ $align }) => ($align === 'end' ? 'right: 0;' : 'left: 0;')}
  min-width: 180px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 50;
  animation: ${fadeIn} 120ms ease-out;
`;

const Item = styled.li`
  margin: 0;
  padding: 0;
`;

const ItemButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 14px;
  color: hsl(var(--foreground));
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 120ms ease;
  &:hover:not(:disabled) {
    background: hsl(var(--muted));
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
  onOpenChange,
}) => {
  const [open, setOpenState] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Wrap ref={wrapRef}>
      {trigger({
        onClick: () => setOpen(!open),
        'aria-expanded': open,
        'aria-haspopup': true,
      })}
      {open && (
        <Menu $align={align} $side={side} role="menu">
          {items.map((item) => (
            <Item key={item.key}>
              <ItemButton
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.leading}
                {item.label}
              </ItemButton>
            </Item>
          ))}
        </Menu>
      )}
    </Wrap>
  );
};
