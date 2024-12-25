import { type Actions } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const location = formData.get('location') as string;
		const redirectUri = location.replaceAll('/login', '');
		const { error } = await event.locals.supabase.auth.signInWithOtp({
			email,
			options: {
				// set this to false if you do not want the user to be automatically signed up
				shouldCreateUser: true,
				emailRedirectTo: redirectUri
			}
		});

		if (!error) {
			return { success: true };
		}
	}
} satisfies Actions;
