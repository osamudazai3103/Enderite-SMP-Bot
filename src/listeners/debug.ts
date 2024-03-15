import { Listener } from '#app/structures/index.js';
import type { Client } from 'discord.js';

export default class extends Listener<'debug'> {
	constructor(client: Client) {
		super(client, { name: 'debug' });
	}

	public run(string: string) {
		if (/Session Limit Information/g.test(string)) {
			console.debug(this.name, string);
		}

		if (/429/g.test(string)) {
			console.debug(this.name, string);
		}
	}
}
