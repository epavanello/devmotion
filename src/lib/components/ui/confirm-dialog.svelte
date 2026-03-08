<script lang="ts">
  import { confirmDialogStore } from '$lib/stores/confirm-dialog.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';

  const state = $derived(confirmDialogStore.state);
</script>

<AlertDialog.Root
  open={state.isOpen}
  onOpenChange={(open) => {
    if (!open) {
      confirmDialogStore.cancel();
    }
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{state.title}</AlertDialog.Title>
      <AlertDialog.Description>
        {state.description}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>{state.cancelLabel}</AlertDialog.Cancel>
      <AlertDialog.Action
        variant={state.variant}
        onclick={() => {
          confirmDialogStore.handleConfirm();
        }}
      >
        {state.confirmLabel}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
