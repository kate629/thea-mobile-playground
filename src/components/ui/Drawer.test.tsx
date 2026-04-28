import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Drawer } from './Drawer';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Drawer', () => {
  afterEach(() => {
    // Drawer locks body overflow while open; ensure tests don't leak state.
    document.body.style.overflow = '';
  });

  it('renders nothing when closed', () => {
    renderWithTheme(
      <Drawer open={false} onClose={() => {}} ariaLabel="closed drawer">
        <div>contents</div>
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with children when open', () => {
    renderWithTheme(
      <Drawer open onClose={() => {}} ariaLabel="open drawer">
        <div>hello world</div>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'open drawer' })).toBeInTheDocument();
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('portals into document.body so the drawer escapes ancestor stacking contexts', () => {
    // Bug #42 sub-issue 1: a transformed/positioned ancestor must not be able
    // to re-anchor the right-side drawer to the left edge.
    renderWithTheme(
      <div style={{ transform: 'translateZ(0)' }}>
        <Drawer open onClose={() => {}} ariaLabel="portal check">
          <div>portal child</div>
        </Drawer>
      </div>,
    );
    const dialog = screen.getByRole('dialog', { name: 'portal check' });
    // The dialog's parent chain should reach document.body without going
    // through the transformed wrapper.
    expect(dialog.closest('[style*="translateZ"]')).toBeNull();
  });

  it('locks body scroll while open and restores on close', () => {
    // Bug #42 sub-issue 4: scrolling inside the drawer must not bubble to
    // the underlying page. Body-scroll-lock is the belt; overscroll-behavior
    // is the suspenders.
    document.body.style.overflow = 'visible';
    const { rerender } = renderWithTheme(
      <Drawer open onClose={() => {}} ariaLabel="scroll lock">
        <div>contents</div>
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      rerender(
        <ThemeProvider theme={theme}>
          <Drawer open={false} onClose={() => {}} ariaLabel="scroll lock">
            <div>contents</div>
          </Drawer>
        </ThemeProvider>,
      );
    });
    expect(document.body.style.overflow).toBe('visible');
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = jest.fn();
    renderWithTheme(
      <Drawer open onClose={onClose} ariaLabel="backdrop click">
        <div>contents</div>
      </Drawer>,
    );
    // Backdrop is the sibling rendered before the dialog inside the portal.
    const dialog = screen.getByRole('dialog', { name: 'backdrop click' });
    const backdrop = dialog.previousElementSibling as HTMLElement;
    expect(backdrop).toBeTruthy();
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on backdrop click when closeOnBackdropClick=false', async () => {
    const onClose = jest.fn();
    renderWithTheme(
      <Drawer open onClose={onClose} closeOnBackdropClick={false} ariaLabel="no backdrop close">
        <div>contents</div>
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog', { name: 'no backdrop close' });
    const backdrop = dialog.previousElementSibling as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape', () => {
    const onClose = jest.fn();
    renderWithTheme(
      <Drawer open onClose={onClose} ariaLabel="escape close">
        <div>contents</div>
      </Drawer>,
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
