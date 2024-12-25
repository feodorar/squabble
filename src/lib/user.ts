import { redirect } from '@sveltejs/kit';
import { prisma } from './db';
import type { user } from '@prisma/client';

export async function getUserFromSessionOrRedirect(event): Promise<user> {
	const { session } = await event.locals.safeGetSession();
	const email = session?.user?.email;
	if (!email) {
		throw redirect(303, '/login');
	}
	let user = await prisma.user.findFirst({ where: { name: email } });
	if (!user) {
		user = await prisma.user.create({ data: { name: email } });
	}

	return user;
}
