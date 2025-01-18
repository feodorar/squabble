<script lang="ts">
	import { prisma } from '$lib/db';
	import OneSignal from '@nolanx/svelte-onesignal';

	OneSignal.init({
		appId: '1a853b4d-510b-4741-b642-4136cce7683e',
		notifyButton: {
			enable: true
		},
		allowLocalhostAsSecureOrigin: true
	}).then(() => {
		console.log('initialized OneSignal');
	});

	OneSignal.on('subscriptionChange', async (isSubscribed) => {
		if (isSubscribed) {
			const token = await OneSignal.getUserId();
			// Save token to Supabase
			saveDeviceToken(token, 'web');
		}
	});

	async function saveDeviceToken(token: string | null | undefined, platform: string) {
		if (token) {
			console.log('token', token);
			prisma.device_tokens.create({ data: { token, platform, user_id: 'test' } });
		}
	}
</script>

<div class="m-4 flex flex-col items-center justify-center">Hello</div>
