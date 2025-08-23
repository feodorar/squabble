import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/db';
import type { MoveRequest } from '$lib/board';

export const POST: RequestHandler = async ({ request }) => {
	const response = await request.json();
	const move = response.move as MoveRequest;

	// TODO: validate move

	const player = await prisma.player.findUnique({ where: { id: move.player_id } });

	if (!player) {
		return json({}, { status: 500 }); // TODO: handle error
	}

	const game = await prisma.game.findUnique({
		where: { id: move.game_id },
		include: { player: true }
	});

	if (!game) {
		return json({}, { status: 500 }); // TODO: handle error
	}

	if (game.current_player_index !== player.order_index) {
		return json({}, { status: 500 }); // TODO: handle error
	}

	// TODO: transactional
	const savedMove = await prisma.move.create({
		data: {
			...move
		}
	});

	let letters = player.letters;

	savedMove.word.split('').forEach((letter) => {
		if (letter !== '_') {
			const index = letters.findIndex((l) => l === letter);
			if (index !== -1) {
				letters.splice(index, 1);
			}
		}
	});

	const allAvailableLetters = game.free_letters;

	const numberOfFreeSpots = 7 - letters.length;
	for (let i = 0; i < Math.min(numberOfFreeSpots, allAvailableLetters.length); i++) {
		const letterIndex = Math.floor(Math.random() * allAvailableLetters.length);
		letters.push(allAvailableLetters[letterIndex]);
		allAvailableLetters.splice(letterIndex, 1);
	}

	await prisma.player.update({
		where: {
			id: player.id
		},
		data: { letters: letters }
	});

	let isGameFinished = false;

	// Path 1/2 to finish game: one player emptied their rack and no other tiles left
	if (letters.length === 0 && allAvailableLetters.length === 0) {
		isGameFinished = true;
	}

	// Path 2/2 to finish game: all player passed their turn twice in a row
	if (move.word.length === 0) {
		const moves = await prisma.move.findMany({
			where: { game_id: game.id }
		});
		moves.sort((a, b) => a.created_at.valueOf() - b.created_at.valueOf());
		const numberOfPlayers = game.player.length;
		const lastTwoRoundsOfMoves = moves.slice(-(numberOfPlayers * 2));
		if (lastTwoRoundsOfMoves.every((m) => m.word.length === 0)) {
			isGameFinished = true;
		}
	}

	if (isGameFinished) {
		await prisma.game.update({
			where: { id: game.id },
			data: { is_finished: true }
		});
	} else {
		// update current player index
		let nextPlayerIndex = player.order_index + 1;
		if (nextPlayerIndex >= game.player.length) {
			nextPlayerIndex = 0;
		}
		await prisma.game.update({
			where: { id: game.id },
			data: { free_letters: allAvailableLetters, current_player_index: nextPlayerIndex }
		});
	}

	return json({ playerLetters: letters }, { status: 200 });
};
