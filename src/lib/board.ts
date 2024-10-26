export type SpecialTile = 'triple-word' | 'double-word' | 'triple-letter' | 'double-letter';
export type Tile = {
	coordinate: Coordinate;
	special?: SpecialTile;
};
export type Coordinate = {
	x: number;
	y: number;
};

export function getBoard(): Tile[] {
	let tiles: Tile[] = [];
	for (let i = 0; i < 15; i++) {
		for (let j = 0; j < 15; j++) {
			const coordinate = { x: i, y: j };
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
