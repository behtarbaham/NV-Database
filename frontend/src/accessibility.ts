export function trapFocusInActiveDialog(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="alertdialog"], [role="dialog"]'));
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) return;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function focusFirstInActiveDialog(): number {
  return window.requestAnimationFrame(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="alertdialog"], [role="dialog"]'));
    const dialog = dialogs[dialogs.length - 1];
    dialog?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
  });
}