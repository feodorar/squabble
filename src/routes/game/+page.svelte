<script lang="ts">
	export let data;
</script>

<div>
	{#if data.games && data.games.length > 0}
		Existing games:
		{#each data.games as game}
			<a href="/game/{game.id}">{game.created_at.toUTCString()}</a>
		{/each}
	{/if}

	<form method="POST" action="?/newgame">
		<button class="mt-4 rounded-full bg-cyan-400 p-4">Start new game</button>
	</form>

	<button class="mt-4 rounded-full bg-cyan-200 p-4">Join game (todo)</button>
</div>
