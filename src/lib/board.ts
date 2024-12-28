import type { game, move } from '@prisma/client';

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
	1: 'LSNRTOAIE',
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

export function constructBoardForGame(moves: move[]): Tile[] {
	// TODO: also construct score
	const board = getEmptyBoard();
	// TODO: optimize algorithm
	for (let move of moves) {
		for (let i = 0; i < move.word.length; i++) {
			const x = move.horizontal ? move.start_x + i : move.start_x;
			const y = move.horizontal ? move.start_y : move.start_y + i;
			const tile = board.find((t) => t.coordinate.x == x && t.coordinate.y == y);
			if (tile && move.word[i] !== '_') {
				tile.placedLetter = move.word[i];
				tile.placedLetterBaseValue = getLetterValue(tile.placedLetter);
			}
		}
	}
	return board;
}
