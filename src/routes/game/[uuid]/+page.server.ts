import { redirect } from '@sveltejs/kit';
import { prisma } from '../../../lib/db';
import { getUserFromSessionOrRedirect } from '$lib/user';

export const load = async (event) => {
	const user = await getUserFromSessionOrRedirect(event);

	const game = await prisma.game.findUnique({
		where: { id: event.params.uuid }
	});
	if (!game) {
		throw redirect(404, '/error');
	}
	const player = await prisma.player.findFirst({
		where: { game_id: game.id, user_id: user.id }
	});

	if (!player) {
		throw redirect(303, `/game/${event.params.uuid}/enter`);
	}

	const moves = await prisma.move.findMany({
		where: { game_id: game.id }
	});

	if (!moves) {
		throw redirect(404, '/error');
	}
	return { game, player, moves };
};
