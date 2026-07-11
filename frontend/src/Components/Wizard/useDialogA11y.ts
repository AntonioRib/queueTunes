import { RefObject, useEffect } from 'react';

/**
 * Wires up baseline modal-dialog accessibility for a container ref:
 *
 * - Autofocus the first focusable element (or the container) on mount.
 * - Restore focus to the previously-focused element on unmount.
 * - Close on `Escape`.
 * - Trap `Tab` / `Shift+Tab` within the container.
 *
 * Consumers still own `role="dialog"`, `aria-modal`, `aria-labelledby`,
 * and `aria-describedby` on the dialog surface.
 *
 * @param ref - Ref to the dialog surface (the element that should trap focus).
 * @param onClose - Called when the user presses Escape.
 */
export function useDialogA11y(
    ref: RefObject<HTMLElement | null>,
    onClose: () => void,
): void {
    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        const focusable = (): HTMLElement[] => {
            const selector =
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
            return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
                el => !el.hasAttribute('aria-hidden'),
            );
        };

        const first = focusable()[0];
        if (first) first.focus();
        else node.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            const items = focusable();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }
            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (event.shiftKey && active === firstItem) {
                event.preventDefault();
                lastItem.focus();
            } else if (!event.shiftKey && active === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        };

        node.addEventListener('keydown', onKeyDown);
        return () => {
            node.removeEventListener('keydown', onKeyDown);
            if (previouslyFocused && document.body.contains(previouslyFocused)) {
                previouslyFocused.focus();
            }
        };
    }, [ref, onClose]);
}
