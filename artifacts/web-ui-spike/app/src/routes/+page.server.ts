import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const handle = String((await request.formData()).get('handle') ?? '').trim();
		if (!/^[a-z0-9.-]{3,}$/.test(handle)) {
			return fail(400, { handle, error: 'Enter a handle of at least 3 letters, digits, dots or dashes.' });
		}
		return { handle, ok: true };
	}
};
