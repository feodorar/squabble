<script lang="ts">
	export let data;
</script>

<div class="m-4 flex h-full flex-col items-center px-4 sm:px-8 md:px-12">
	<form method="POST" action="?/newgame">
		<button class="rounded-full bg-cyan-400 p-4">Start new game</button>
	</form>

	<div class="my-3">or</div>

	{#if data.games && data.games.length > 0}
		<div class="mb-2 mt-4 font-bold">Open an existing game:</div>
		<div
			class="mx-auto grid w-full grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3"
		>
			{#each data.games as game}
				<a href="/game/{game.id}" class="w-full max-w-[300px]" class:opacity-50={game.is_finished}>
					<div class="flex aspect-square w-full flex-col items-center justify-center">
						<div class="board grid w-full gap-px">
							{#each game.board.board as tile}
								<div
									class="w-1/15 flex aspect-square items-center justify-center bg-amber-100"
									class:bg-red-400={tile.special === 'triple-word'}
									class:bg-red-200={tile.special === 'double-word'}
									class:bg-cyan-400={tile.special === 'triple-letter'}
									class:bg-cyan-200={tile.special === 'double-letter'}
								>
									{#if tile.placedLetter}
										<div
											class="relative m-[1px] flex aspect-square w-full items-center justify-center bg-white text-[8px]/[10px] md:text-xs"
										>
											{tile.placedLetter.toUpperCase()}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
					<span
						>{game.player.length} players, created {game.created_at.toLocaleDateString(undefined, {
							year: '2-digit',
							month: '2-digit',
							day: '2-digit'
						})}</span
					>
					{#if game.is_finished}
						<span class="text-xs">(finished)</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.board {
		grid-template-columns: repeat(15, 1fr);
	}
</style>
