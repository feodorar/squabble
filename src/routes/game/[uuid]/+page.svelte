<script lang="ts">
	export let data;

	import {
		constructBoardForGame,
		type MoveRequest,
		type MoveResponse,
		type Tile
	} from '$lib/board';

	let board = constructBoardForGame(data.moves);
	let selectedLetterIndex: number | undefined;
	let placedLetters: { letterIndex: number; tile: Tile }[] = [];
	let moveScore = 0; // TODO
	let playerLetters = data.player.letters;

	function selectTile(tile: Tile): void {
		if (tile.placedLetter) {
			return;
		}
		if (selectedLetterIndex === undefined) {
			return;
		}
		const letter = playerLetters[selectedLetterIndex];
		tile.placedLetter = letter;
		placedLetters.push({ letterIndex: selectedLetterIndex, tile });
		selectedLetterIndex = undefined;
		placedLetters = placedLetters;
		board = board;
	}
	function selectLetter(index: number): void {
		if (placedLetters.some((m) => m.letterIndex === index)) {
			return;
		}
		selectedLetterIndex = index;
	}

	function resetMove(): void {
		placedLetters.forEach((l) => {
			const tile = board.find((t) => t === l.tile);
			if (tile) {
				tile.placedLetter = undefined;
			}
		});
		placedLetters = [];
		selectedLetterIndex = undefined;
		board = board;
	}

	async function submitMove(): Promise<void> {
		// TODO: validate move

		if (placedLetters.length < 1) {
			return; // TODO: handle error
		}

		let sortedLetters = placedLetters.sort((l1, l2) => {
			if (l1.tile.coordinate.x === l2.tile.coordinate.x) {
				return l1.tile.coordinate.y - l2.tile.coordinate.y;
			}
			return l1.tile.coordinate.x - l2.tile.coordinate.x;
		});

		let horizontal =
			sortedLetters.length === 1
				? true
				: sortedLetters[0].tile.coordinate.y === sortedLetters[1].tile.coordinate.y;

		const firstLetter = sortedLetters[0];
		let word = firstLetter.tile.placedLetter!;
		let previousCoordinate = firstLetter.tile.coordinate;

		placedLetters.slice(1).forEach((letter) => {
			let skipDistance = horizontal
				? letter.tile.coordinate.x - previousCoordinate.x - 1
				: letter.tile.coordinate.y - previousCoordinate.y - 1;

			for (let i = 0; i < skipDistance; i++) {
				word += '_';
			}

			word += letter.tile.placedLetter!;
			previousCoordinate = letter.tile.coordinate;
		});

		const move: MoveRequest = {
			horizontal: horizontal,
			start_x: firstLetter.tile.coordinate.x,
			start_y: firstLetter.tile.coordinate.y,
			word,
			game_id: data.game.id,
			player_id: data.player.id
		};

		const response = await fetch('/api/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ move })
		});

		const result = (await response.json()) as MoveResponse;

		placedLetters = [];
		playerLetters = result.playerLetters;
	}
</script>

<div class="flex h-full flex-col gap-4 lg:flex-row">
	<div class="flex w-full flex-col">
		<div class="font-bold">Created at:</div>
		<div>{data.game.created_at.toUTCString()}</div>

		<div class="mt-4 font-bold">Players:</div>
		{#each data.players as player}
			<div>{player.user.name}</div>
		{/each}

		<div class="mb-4 mt-2 text-sm">To invite more players, just send them the current url.</div>
		<div class="my-4 mt-auto flex w-full flex-wrap justify-center">
			<div class="mb-4 flex justify-center gap-4 bg-green-800 px-4 py-2">
				{#each playerLetters as letter, index}
					<button
						class="flex h-4 w-4 items-center justify-center sm:h-6 sm:w-6 md:h-9 md:w-9"
						class:border={selectedLetterIndex == index}
						class:bg-white={selectedLetterIndex != index}
						class:bg-black={selectedLetterIndex == index}
						class:text-white={selectedLetterIndex == index}
						class:opacity-25={!!placedLetters.find((l) => l.letterIndex === index)}
						disabled={!!placedLetters.find((l) => l.letterIndex === index)}
						on:click={() => selectLetter(index)}
					>
						{letter.toUpperCase()}
					</button>
				{/each}
			</div>
			<div class="flex w-full justify-center">
				<button class="mr-4 rounded-full bg-cyan-400 p-2 sm:p-4" on:click={submitMove}
					>Submit move</button
				>
				<button class="rounded-full border p-2 sm:p-4" on:click={resetMove}>Reset move</button>
			</div>
		</div>
	</div>
	<div
		class="flex aspect-square w-full flex-col items-center justify-center lg:mx-auto lg:h-full lg:w-auto"
	>
		<div class="board grid w-full gap-1">
			{#each board as tile}
				<button
					class="w-1/15 lg:h-1/15 flex aspect-square items-center justify-center bg-amber-100 hover:brightness-90 lg:w-auto"
					class:bg-red-400={tile.special === 'triple-word'}
					class:bg-red-200={tile.special === 'double-word'}
					class:bg-cyan-400={tile.special === 'triple-letter'}
					class:bg-cyan-200={tile.special === 'double-letter'}
					on:click={() => selectTile(tile)}
				>
					{#if tile.placedLetter}
						<div
							class="m-0.25 flex aspect-square w-full items-center justify-center bg-white sm:m-0.5 xl:text-xl 2xl:text-2xl"
						>
							{tile.placedLetter.toUpperCase()}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.board {
		grid-template-columns: repeat(15, 1fr);
	}
</style>
