import { constructBoardAndScoresForGame, getAllLetters } from '$lib/board';
import { prisma } from '$lib/db';
import { getUserFromSessionOrRedirect } from '$lib/user';
import { redirect, type Actions } from '@sveltejs/kit';

export const load = async (event) => {
	let user = await getUserFromSessionOrRedirect(event);
	const games = await prisma.game.findMany({
		where: {
			player: {
				some: {
					user_id: user.id
				}
			}
		},
		include: {
			player: true,
			move: true
		}
	});
	return {
		user,
		games: games
			.sort((g1, g2) => g2.created_at.valueOf() - g1.created_at.valueOf())
			.map((game) => ({ ...game, board: constructBoardAndScoresForGame(game.move) }))
	};
};

export const actions = {
	newgame: async (event) => {
		let user = await getUserFromSessionOrRedirect(event);

		const playerLetters = [];
		const allAvailableLetters = getAllLetters();

		for (let i = 0; i < 7; i++) {
			const letterIndex = Math.floor(Math.random() * allAvailableLetters.length);
			playerLetters.push(allAvailableLetters[letterIndex]);
			allAvailableLetters.splice(letterIndex, 1);
		}

		// TODO: transactional
		const game = await prisma.game.create({ data: { free_letters: allAvailableLetters } });
		await prisma.player.create({
			data: {
				game_id: game.id,
				user_id: user.id,
				letters: playerLetters,
				order_index: 0
			}
		});

		return redirect(303, `/game/${game.id}`);
	}
} satisfies Actions;
