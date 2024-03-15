import { Listener } from '#app/structures/index.js';
import type { Client } from 'discord.js';

export default class extends Listener<'ready'> {
	constructor(client: Client) {
		super(client, { name: 'ready', once: true });
	}

	run(client: Client<true>) {
		console.log(`Logged in as ${client.user.tag}.`);

		if (process.argv[2] === '-dev') {
			client.stores.inhibitors.forEach((_, k) => {
				if (k !== 'core') return;
				client.stores.inhibitors.delete(k);
			});
		}
	}
}
