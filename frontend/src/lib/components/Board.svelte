<script lang="ts">
	import { getBoard, type Coordinate, type Tile } from '$lib/board';
	const tiles = getBoard();
	let selected: Coordinate | undefined;

	function selectTile(tile: Tile): void {
		selected = tile.coordinate;
		console.log(selected);
	}
</script>

<div class="game grid gap-1">
	{#each tiles as tile}
		<button
			class="bg- bg- h-10 w-10 bg-amber-100 hover:brightness-90"
			class:bg-red-400={tile.special === 'triple-word'}
			class:bg-red-200={tile.special === 'double-word'}
			class:bg-cyan-400={tile.special === 'triple-letter'}
			class:bg-cyan-200={tile.special === 'double-letter'}
			class:border={selected == tile.coordinate}
			class:border-gray-500-={selected == tile.coordinate}
			class:brightness-90={selected == tile.coordinate}
			on:click={() => selectTile(tile)}
		></button>
	{/each}
</div>

<style>
	.game {
		grid-template-columns: repeat(15, 1fr);
	}
</style>
