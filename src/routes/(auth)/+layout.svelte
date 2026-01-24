<script lang="ts">
  let { children } = $props();
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  {@render children?.()}
</div>
