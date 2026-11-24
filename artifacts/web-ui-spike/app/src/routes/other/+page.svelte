<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	let shown = $state(false);
</script>

<svelte:head><title>Other page</title></svelte:head>
<main class="p-8">
	<a href="/" id="home">Home</a>
	<button id="fly" class="scoped" onclick={() => (shown = !shown)}>Toggle transition</button>
	{#if shown}<p id="flown" transition:fly={{ y: 20 }}>Flown in</p><p in:fade>Faded</p>{/if}
</main>

<style>
	.scoped { text-decoration: underline; }
</style>
