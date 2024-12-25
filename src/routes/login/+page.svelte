<script lang="ts">
	import { onMount } from 'svelte';

	export let form;

	let current_url = '';
	onMount(() => (current_url = window.location.href));
</script>

{#if form?.success}
	<div>Check your inbox</div>
{:else}
	<form method="POST" class="m-4 flex flex-col items-center gap-4">
		<h1 class="text-xl">Login</h1>
		<input class="border p-4" placeholder="E-Mail" name="email" />
		<input hidden name="location" bind:value={current_url} />
		<button class="rounded-full bg-cyan-400 p-4">Get your login link to your inbox</button>
	</form>
{/if}
