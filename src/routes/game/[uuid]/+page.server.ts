import { redirect } from '@sveltejs/kit';
import { prisma } from '../../../lib/db';
import { getUserFromSessionOrRedirect } from '$lib/user';
import { constructBoardAndScoresForGame } from '$lib/board';

export const load = async (event) => {
	const user = await getUserFromSessionOrRedirect(event);

	const game = await prisma.game.findUnique({
		where: { id: event.params.uuid }
	});
	if (!game) {
		throw redirect(404, '/error');
	}
	const players = await prisma.player.findMany({
		where: { game_id: game.id },
		include: {
			user: true
		}
	});
	const player = players.find((player) => player.user_id === user.id);

	if (!player) {
		throw redirect(303, `/game/${event.params.uuid}/enter`);
	}

	const moves = await prisma.move.findMany({
		where: { game_id: game.id }
	});

	if (!moves) {
		throw redirect(404, '/error');
	}
	let { board, scores, scoredMoves } = constructBoardAndScoresForGame(
		moves,
		players,
		game.is_finished
	);
	return {
		game,
		player,
		players: players.sort((p1, p2) => p1.order_index - p2.order_index),
		board,
		scores,
		maxScore: Math.max(...Array.from(scores.values())),
		scoredMoves: scoredMoves.sort(
			(m1, m2) => m2.move.created_at.valueOf() - m1.move.created_at.valueOf()
		)
	};
};
