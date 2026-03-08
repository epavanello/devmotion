/**
 * Global confirmation dialog store
 * Provides a centralized way to show confirmation dialogs throughout the app
 */

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (() => void) | null;
  variant?: 'default' | 'destructive';
}

class ConfirmDialogStore {
  #state = $state<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
    variant: 'default'
  });

  get state() {
    return this.#state;
  }

  /**
   * Show a confirmation dialog
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirm(options: {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.#state = {
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        variant: options.variant ?? 'default',
        onConfirm: () => {
          this.close();
          resolve(true);
        }
      };

      // Store reject callback for cancel
      (this.#state as ConfirmDialogState & { onCancel?: () => void }).onCancel = () => {
        this.close();
        resolve(false);
      };
    });
  }

  close() {
    this.#state.isOpen = false;
  }

  cancel() {
    const onCancel = (this.#state as ConfirmDialogState & { onCancel?: () => void }).onCancel;
    if (onCancel) {
      onCancel();
    } else {
      this.close();
    }
  }

  handleConfirm() {
    if (this.#state.onConfirm) {
      this.#state.onConfirm();
    }
  }
}

export const confirmDialogStore = new ConfirmDialogStore();
