<script lang="ts">
  let { children } = $props();
</script>

<div class="h-screen w-full">
  {@render children?.()}
</div>
