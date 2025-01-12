import { prisma } from '$lib/db';
import { getUserFromSessionOrRedirect } from '$lib/user';
import { redirect, type Actions } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const user = await getUserFromSessionOrRedirect(event);
		const game = await prisma.game.findUnique({
			where: { id: event.params.uuid },
			include: { player: true }
		});
		if (!game) {
			throw redirect(303, '/error');
		}

		const player = await prisma.player.findFirst({ where: { user_id: user.id, game_id: game.id } });

		if (player) {
			redirect(303, `/game/${game.id}`);
		}

		const playerLetters = [];
		const allAvailableLetters = game.free_letters;

		for (let i = 0; i < Math.min(7, allAvailableLetters.length); i++) {
			const letterIndex = Math.floor(Math.random() * allAvailableLetters.length);
			playerLetters.push(allAvailableLetters[letterIndex]);
			allAvailableLetters.splice(letterIndex, 1);
		}

		// TODO: transactional
		await prisma.game.update({
			where: { id: game.id },
			data: { free_letters: allAvailableLetters }
		});
		await prisma.player.create({
			data: {
				game_id: game.id,
				user_id: user.id,
				letters: playerLetters,
				order_index: game.player.length ?? 0
			}
		});

		return redirect(303, `/game/${game.id}`);
	}
} satisfies Actions;
