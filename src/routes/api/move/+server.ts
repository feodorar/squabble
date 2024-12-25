import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/db';
import type { MoveRequest } from '$lib/board';

export const POST: RequestHandler = async ({ request }) => {
	const response = await request.json();
	const move = response.move as MoveRequest;

	// TODO: validate move

	const savedMove = await prisma.move.create({
		data: {
			...move
		}
	});

	const player = await prisma.player.findUnique({ where: { id: move.player_id } });

	if (!player) {
		return json({}, { status: 500 }); // TODO: handle error
	}

	let letters = player.letters;

	move.word.split('').forEach((letter) => {
		if (letter !== '_') {
			const index = player.letters.findIndex((l) => l === letter);
			if (index !== -1) {
				letters.splice(index, 1);
			}
		}
	});

	const game = await prisma.game.findUnique({ where: { id: move.game_id } });
	if (!game) {
		return json({}, { status: 500 }); // TODO: handle error
	}

	const allAvailableLetters = game.free_letters;

	const numberOfFreeSpots = 7 - letters.length;
	for (let i = 0; i < numberOfFreeSpots; i++) {
		const letterIndex = Math.floor(Math.random() * allAvailableLetters.length);
		letters.push(allAvailableLetters[letterIndex]);
		allAvailableLetters.splice(letterIndex, 1);
	}

	// TODO: transactional
	await prisma.player.update({
		where: {
			id: player.id
		},
		data: { letters: letters }
	});
	await prisma.game.update({
		where: { id: game.id },
		data: { free_letters: allAvailableLetters }
	});

	return json({ playerLetters: letters }, { status: 200 });
};
