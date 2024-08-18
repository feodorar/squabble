<script lang="ts">
	import Board from '$lib/components/Board.svelte';

	let hello: string;
	async function getHello() {
		const response = await fetch('http://localhost:3000/squabble');
		hello = await response.text();
	}
</script>

<div class="m-4 flex flex-col items-center justify-center">
	<Board />
	<button class="m-4 bg-blue-800 p-4 text-white" on:click={getHello}>Say Hello</button>
	{#if hello !== undefined}
		{hello}
	{/if}
</div>
