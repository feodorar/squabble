<script lang="ts">
	let hello: string;
	async function getHello() {
		const response = await fetch('http://localhost:3000/squabble');
		hello = await response.text();
	}
</script>

<div class="m-4 flex flex-col items-center justify-center">
	<h1 class="text-3xl font-bold underline">Welcome to SvelteKit</h1>
	<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
	<button class="m-4 bg-blue-800 p-4 text-white" on:click={getHello}>Say Hello</button>
	{#if hello !== undefined}
		{hello}
	{/if}
</div>
