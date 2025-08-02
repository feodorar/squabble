<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { getLetterValue, type MoveRequest, type MoveResponse, type Tile } from '$lib/board';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { createClient } from '@supabase/supabase-js';

	export let data;

	$: board = data.board;
	$: scores = data.scores;
	let selectedLetterIndex: number | undefined;
	let placedLetters: { letterIndex: number; tile: Tile }[] = [];
	let moveScore = 0; // TODO
	let playerLetters = data.player.letters;

	// TODO: rerun, hwne game id changes. cancel old usbscription and then create new
	onMount(() => {
		const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
		supabaseClient
			.channel('public:move')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'move'
					// filter: `game_id=eq.${gameId}` // Only listen to changes where game_id matches
				},
				(_) => {
					reloadBoardAndScores();
				}
			)
			.subscribe((update) => {
				console.log(update);
			});
	});

	function reloadBoardAndScores() {
		// TODO: only invalidate this page? Maybe change to form action, which would trigger reload
		invalidateAll();
		scores = scores;
		board = board;
	}

	function selectTile(tile: Tile): void {
		if (tile.placedLetter) {
			return;
		}
		if (selectedLetterIndex === undefined) {
			return;
		}
		const letter = playerLetters[selectedLetterIndex];
		tile.placedLetter = letter;
		tile.placedLetterBaseValue = getLetterValue(letter);
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
				tile.placedLetterBaseValue = undefined;
			}
		});
		placedLetters = [];
		selectedLetterIndex = undefined;
		board = board;
	}

	async function passMove(): Promise<void> {
		const move: MoveRequest = {
			game_id: data.game.id,
			player_id: data.player.id,
			horizontal: true,
			start_x: 0,
			start_y: 0,
			word: '' // Empty word indicates a pass
		};

		const response = await fetch('/api/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ move })
		});

		if (response.ok) {
			placedLetters = [];
			reloadBoardAndScores();
		} else {
			console.error('Failed to pass turn');
		}
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

		// invalidateAll(); // TODO: only invalidate this? Maybe change to form action, which would trigger reload
		// scores = scores;
	}
</script>

<div class="flex h-full flex-col gap-4 lg:flex-row">
	<div class="flex w-full flex-col lg:order-2">
		{#if data.game.is_finished}
			<div class="m-4 flex flex-col items-center justify-center">
				<h1 class="text-2xl">Game finished</h1>
			</div>
		{/if}
		<div class="mb-2 font-bold">Players*:</div>

		{#each data.players as player}
			<div
				class="inline-flex w-[90%] max-w-96 gap-3"
				class:text-cyan-900={player.order_index === data.game.current_player_index}
			>
				<div>
					{player.order_index + 1}
				</div>
				<div class="grow truncate">
					<span>{player.user.name}</span>
					{#if player.order_index === data.game.current_player_index && !data.game.is_finished}
						({data.player.id === player.id ? 'your' : 'their'} turn)
					{/if}
					{#if data.game.is_finished && scores.get(player.id) === data.maxScore}
						<span class="text-sm">Winner</span>
					{/if}
				</div>
				<div>
					<span class="font-bold">{scores.get(player.id) ?? 0}</span>
				</div>
			</div>
		{/each}

		<details class="my-4 overflow-hidden">
			<summary>View game history</summary>
			<div class="grid h-full max-w-96 grid-cols-5 gap-x-3 overflow-auto pb-8 text-xs">
				{#each data.scoredMoves as scoredMove}
					<div class="col">
						{scoredMove.move.created_at.toLocaleDateString(undefined, {
							year: '2-digit',
							month: '2-digit',
							day: '2-digit'
						})}
					</div>
					<div class="col-span-2 truncate">
						{data.players.find((p) => p.id === scoredMove.move.player_id)?.user.name}
					</div>
					<div class="col">{scoredMove.move.word || '(passed)'}</div>
					<div class="col font-bold">{scoredMove.score}</div>
				{/each}
			</div>
		</details>

		<div class="mb-4 mt-2 text-xs lg:mt-auto">
			*To invite more players, just send them the current url.
		</div>
	</div>
	<div
		class="flex aspect-square w-full flex-col items-center justify-center pb-20 lg:order-1 lg:h-full lg:w-auto lg:pb-0"
	>
		<div class="board grid w-full gap-px">
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
							class="relative m-[1px] flex aspect-square w-full items-center justify-center bg-white text-sm sm:m-0.5 xl:text-xl 2xl:text-2xl"
						>
							{tile.placedLetter.toUpperCase()}

							<div class="absolute bottom-0 right-0 mr-0.5 text-[8px]/[10px] sm:text-xs">
								{tile.placedLetterBaseValue}
							</div>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>
{#if !data.game.is_finished}
	<div class="bottom-bar fixed bottom-0 left-0 grid min-h-12 w-full gap-4 bg-green-800 p-3">
		<button
			class="resetBtn mr-auto rounded-full bg-white p-2 text-black disabled:cursor-not-allowed disabled:bg-gray-400"
			disabled={placedLetters.length === 0}
			on:click={resetMove}
		>
			Reset move
		</button>
		<div class="letters flex justify-center gap-3">
			{#each playerLetters as letter, index}
				<button
					class="relative flex aspect-square h-9 items-center justify-center md:h-12"
					class:border={selectedLetterIndex == index}
					class:bg-white={selectedLetterIndex != index}
					class:bg-black={selectedLetterIndex == index}
					class:text-white={selectedLetterIndex == index}
					class:opacity-25={!!placedLetters.find((l) => l.letterIndex === index)}
					disabled={!!placedLetters.find((l) => l.letterIndex === index)}
					on:click={() => selectLetter(index)}
				>
					{letter.toUpperCase()}
					<div class="absolute bottom-0 right-0 mr-0.5 text-xs">{getLetterValue(letter)}</div>
				</button>
			{/each}
		</div>

		{#if placedLetters.length < 1}
			<button
				class="submitBtn ml-auto rounded-full bg-cyan-400 p-2 disabled:cursor-not-allowed disabled:bg-gray-400"
				disabled={data.player.order_index !== data.game.current_player_index}
				on:click={passMove}
			>
				Pass turn
			</button>
		{:else}
			<button
				class="submitBtn ml-auto rounded-full bg-cyan-400 p-2 disabled:cursor-not-allowed disabled:bg-gray-400"
				disabled={data.player.order_index !== data.game.current_player_index}
				on:click={submitMove}
			>
				Submit move
			</button>
		{/if}
	</div>
{/if}

<style>
	.board {
		grid-template-columns: repeat(15, 1fr);
	}
	.bottom-bar {
		grid-template-areas:
			'letters letters'
			'resetBtn submitBtn';

		@media only screen and (min-width: 600px) {
			grid-template-areas: 'resetBtn letters submitBtn';
		}
	}

	.letters {
		grid-area: letters;
	}
	.resetBtn {
		grid-area: resetBtn;
	}
	.submitBtn {
		grid-area: submitBtn;
	}
</style>
