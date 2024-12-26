<script lang="ts">
	export let data;
</script>

<div class="m-4 flex h-full flex-col items-center">
	{#if data.games && data.games.length > 0}
		<div class="mt-4 font-bold">Open an existing game:</div>
		{#each data.games as game}
			<a href="/game/{game.id}">{game.created_at.toUTCString()}</a>
		{/each}
	{/if}

	<div>or</div>

	<form method="POST" action="?/newgame">
		<button class="mt-4 rounded-full bg-cyan-400 p-4">Start new game</button>
	</form>
</div>
