import type { game, move, player } from '@prisma/client';

export type SpecialTile = 'triple-word' | 'double-word' | 'triple-letter' | 'double-letter';
export type Tile = {
	coordinate: Coordinate;
	special?: SpecialTile;
	placedLetter?: string;
	placedLetterBaseValue?: number;
};
export type Coordinate = {
	x: number;
	y: number;
};
export type MoveRequest = Pick<
	move,
	'horizontal' | 'start_x' | 'start_y' | 'word' | 'game_id' | 'player_id'
>;
export type MoveResponse = {
	playerLetters: string[];
};

export function getEmptyBoard(): Tile[] {
	let tiles: Tile[] = [];
	for (let y = 0; y < 15; y++) {
		for (let x = 0; x < 15; x++) {
			const coordinate = { x, y };
			tiles.push({ coordinate, special: getSpecial(coordinate) });
		}
	}
	return tiles;
}

const tripleWordTiles: Coordinate[] = [0, 7, 14]
	.flatMap((y) => [0, 7, 14].flatMap((x) => ({ x, y })))
	.filter((c) => !(c.x === 7 && c.y === 7));

const doubleWordTiles: Coordinate[] = [1, 2, 3, 4, 7, 10, 11, 12, 13].flatMap((n) => [
	{ x: n, y: n },
	{ x: n, y: 14 - n }
]);

const tripleLetterTiles: Coordinate[] = [1, 5, 9, 13]
	.flatMap((y) => [1, 5, 9, 13].flatMap((x) => ({ x, y })))
	.filter((c) => !([1, 13].includes(c.x) && [1, 13].includes(c.y)));

const doubleLetterTiles: Coordinate[] = [3, 11]
	.flatMap((n) => [
		{ x: 0, y: n },
		{ x: 14, y: n },
		{ x: n, y: 0 },
		{ x: n, y: 14 },
		{ x: 7, y: n },
		{ x: n, y: 7 }
	])
	.concat(
		[6, 8].flatMap((n) => [
			{ x: n, y: 2 },
			{ x: 2, y: n },
			{ x: 6, y: n },
			{ x: n, y: 6 },
			{ x: 8, y: n },
			{ x: n, y: 8 },
			{ x: n, y: 12 },
			{ x: 12, y: n }
		])
	);

const LETTER_FREQUENCIES = {
	1: 'JKQXZ',
	2: 'BCFHMPVWY?',
	3: 'G',
	4: 'DLSU',
	6: 'NRT',
	8: 'O',
	9: 'AI',
	12: 'E'
};

const LETTER_VALUES = {
	1: 'LSUNRTOAIE',
	2: 'GD',
	3: 'BCMP',
	4: 'FHVWY',
	5: 'K',
	8: 'JX',
	10: 'QZ'
};

export function getLetterValue(letter: string): number {
	for (let [value, letters] of Object.entries(LETTER_VALUES)) {
		if (letters.includes(letter)) {
			return +value;
		}
	}
	return 0;
}

export function getAllLetters(): string[] {
	let allLetters: any[] = [];
	for (let [freq, letters] of Object.entries(LETTER_FREQUENCIES)) {
		for (let i = 0; i < parseInt(freq); i++) {
			allLetters.push(...letters.split(''));
		}
	}
	return allLetters;
}

function getSpecial(coordinate: Coordinate): SpecialTile | undefined {
	let special: SpecialTile | undefined;
	if (tripleWordTiles.find((c) => c.x === coordinate.x && c.y === coordinate.y)) {
		special = 'triple-word';
	}
	if (doubleWordTiles.find((c) => c.x === coordinate.x && c.y === coordinate.y)) {
		special = 'double-word';
	}
	if (tripleLetterTiles.find((c) => c.x === coordinate.x && c.y === coordinate.y)) {
		special = 'triple-letter';
	}
	if (doubleLetterTiles.find((c) => c.x === coordinate.x && c.y === coordinate.y)) {
		special = 'double-letter';
	}
	return special;
}

export function constructBoardAndScoresForGame(
	moves: move[],
	players: player[],
	isFinished: boolean
): {
	board: Tile[];
	scores: Map<string, number>;
} {
	const scores = new Map<string, number>();
	const board = getEmptyBoard();
	moves.sort((m1, m2) => m1.created_at.valueOf() - m2.created_at.valueOf());

	// TODO: optimize algorithms
	for (let move of moves) {
		const placedTiles = placeLettersOfMoveOnBoard(board, move);
		const wordsInMove = getWordsForMove(board, move);
		let moveScore = 0;
		for (let word of wordsInMove) {
			moveScore += getScoreOfWord(word, placedTiles);
		}
		const player_id = move.player_id;
		scores.set(player_id, (scores.get(player_id) ?? 0) + moveScore);
		// console.log('Move', move.word, 'player', player_id, 'score', moveScore);
	}

	if (isFinished) {
		applyEndGameScores(players, scores);
	}

	return { board, scores };
}

function applyEndGameScores(players: player[], scores: Map<string, number>): Map<string, number> {
	// After all the scores are added up, each player’s score is reduced
	// by the sum of their unplayed tiles, and if one player has used all
	// their tiles, their score is increased by the sum of the unplayed
	// tiles of all the other players.
	// e.g. If Player one has an X and an A left on their rack at the end
	// of the game, their score is reduced by 9 points. The player who
	// used all their tiles adds 9 points to their score.
	let allUnplayedTilesScore = 0;
	players
		.filter((p) => p.letters.length > 0)
		.forEach((player) => {
			const playerScore = scores.get(player.id) ?? 0;
			const unplayedTiles = player.letters;

			const unplayedTilesScore = unplayedTiles.reduce(
				(sum, letter) => sum + getLetterValue(letter),
				0
			);
			scores.set(player.id, playerScore - unplayedTilesScore);
			allUnplayedTilesScore += unplayedTilesScore;
		});
	players
		.filter((p) => p.letters.length === 0)
		.forEach((player) => {
			const playerScore = scores.get(player.id) ?? 0;
			scores.set(player.id, playerScore + allUnplayedTilesScore);
		});

	return scores;
}

function getScoreOfWord(word: Tile[], newlyPlacedTiles: Tile[]): number {
	let score = 0;
	let wordMultiplier = 1;

	for (let tile of word) {
		let letterMultiplier = 1;

		if (includesTile(newlyPlacedTiles, tile)) {
			if (tile.special === 'double-word') {
				wordMultiplier *= 2;
			}

			if (tile.special === 'triple-word') {
				wordMultiplier *= 3;
			}

			if (tile.special === 'double-letter') {
				letterMultiplier = 2;
			}

			if (tile.special === 'triple-letter') {
				letterMultiplier = 3;
			}
		}
		score += tile?.placedLetterBaseValue ? tile.placedLetterBaseValue * letterMultiplier : 0;
	}

	return score * wordMultiplier;
}

function includesTile(tiles: Tile[], tile: Tile): boolean {
	return tiles.some(
		(t) => t.coordinate.x === tile.coordinate.x && t.coordinate.y === tile.coordinate.y
	);
}

function placeLettersOfMoveOnBoard(board: Tile[], move: move): Tile[] {
	const tiles = [];
	for (let i = 0; i < move.word.length; i++) {
		const x = move.horizontal ? move.start_x + i : move.start_x;
		const y = move.horizontal ? move.start_y : move.start_y + i;
		const tile = board.find((t) => t.coordinate.x == x && t.coordinate.y == y);
		const letter = move.word[i];
		if (tile && letter !== '_') {
			tile.placedLetter = letter;
			tile.placedLetterBaseValue = getLetterValue(letter);
			tiles.push(tile);
		}
	}

	return tiles;
}

function getWordsForMove(board: Tile[], move: move): Tile[][] {
	if (move.word.length < 1) {
		return [];
	}

	const wordsInMove: Tile[][] = [];

	let moveStart = move.horizontal ? move.start_x : move.start_y;
	let moveEnd = moveStart + move.word.length - 1;

	// travers to find the complete primary word
	const tilesOfPrimaryWord = findCompleteWord(
		board,
		move.horizontal,
		moveStart,
		moveEnd,
		move.horizontal ? move.start_y : move.start_x
	);
	wordsInMove.push(tilesOfPrimaryWord);

	// travers to find find all secondary words
	for (let i = moveStart; i <= moveEnd; i++) {
		const tile = board.find((tile) =>
			move.horizontal
				? tile.coordinate.x === i && tile.coordinate.y === move.start_y
				: tile.coordinate.y === i && tile.coordinate.x === move.start_x
		);

		const letter = move.word[i - moveStart];
		if (tile && letter !== '_') {
			const fixedDimensionIndex = move.horizontal ? tile.coordinate.x : tile.coordinate.y;
			const traversalDimensionStartIndex = move.horizontal ? tile.coordinate.y : tile.coordinate.x;

			const tilesOfSecondaryWord = findCompleteWord(
				board,
				!move.horizontal,
				traversalDimensionStartIndex,
				traversalDimensionStartIndex,
				fixedDimensionIndex
			);

			wordsInMove.push(tilesOfSecondaryWord);
		}
	}

	return wordsInMove;
}

function findCompleteWord(
	board: Tile[],
	traverseHorizontal: boolean,
	primaryDimensionMinIncl: number,
	primaryDimensionMaxIncl: number,
	fixedDimensionIndex: number
): Tile[] {
	// travers left/above of word until no placed letter
	let completeWordStartIncl = primaryDimensionMinIncl;
	for (let i = primaryDimensionMinIncl - 1; i >= 0; i--) {
		const connectedLetterTile = board.find((t) =>
			traverseHorizontal
				? t.coordinate.x == i && t.coordinate.y == fixedDimensionIndex
				: t.coordinate.y == i && t.coordinate.x == fixedDimensionIndex
		);
		if (connectedLetterTile?.placedLetter) {
			completeWordStartIncl = i;
		} else {
			break;
		}
	}

	// travers right/below of word until no placed letter
	let completeWordEndIncl = primaryDimensionMaxIncl;
	for (let i = primaryDimensionMaxIncl + 1; i < 15; i++) {
		const connectedLetterTile = board.find((t) =>
			traverseHorizontal
				? t.coordinate.x == i && t.coordinate.y == fixedDimensionIndex
				: t.coordinate.y == i && t.coordinate.x == fixedDimensionIndex
		);
		if (connectedLetterTile?.placedLetter) {
			completeWordEndIncl = i;
		} else {
			break;
		}
	}

	const tilesOfCompleteWord: Tile[] = [];

	for (let i = completeWordStartIncl; i <= completeWordEndIncl; i++) {
		const tile = board.find((tile) =>
			traverseHorizontal
				? tile.coordinate.x === i && tile.coordinate.y === fixedDimensionIndex
				: tile.coordinate.y === i && tile.coordinate.x === fixedDimensionIndex
		);
		if (tile) {
			tilesOfCompleteWord.push(tile);
		}
	}

	tilesOfCompleteWord.length < 2;
	return tilesOfCompleteWord.length < 2 ? [] : tilesOfCompleteWord;
}
