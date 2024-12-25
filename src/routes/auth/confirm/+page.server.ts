import { prisma } from '$lib/db';
import { getUserFromSessionOrRedirect } from '$lib/user';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const token_hash = event.url.searchParams.get('token_hash');
	const { error } = await event.locals.supabase.auth.verifyOtp({ token_hash, type: 'magiclink' });

	if (!error) {
		redirect(303, '/game');
	}

	// TODO: hanlde error

	return {};
};
