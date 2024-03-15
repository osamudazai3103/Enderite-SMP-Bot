import { Listener } from '#app/structures/index.js';
import { Client, codeBlock, EmbedBuilder, Message, WebhookClient } from 'discord.js';
import { inspect } from 'node:util';

export default class extends Listener<any> {
	constructor(client: Client) {
		super(client, { name: 'unhandledRejection', emitter: process });
	}

	client = new WebhookClient({ url: process.env.REPORTER_URL! });

	public run(err: Error, cause: Promise<any> | Message) {
		console.dir(err, { depth: null });

		const embed = new EmbedBuilder()
			.setTitle('An error occured.')
			.setDescription(`${codeBlock('js', inspect(err, { depth: null }))}`);

		if (cause instanceof Message) {
			embed.setFields({ name: 'Jump to command', value: cause.url });
		}
		this.client.send({ embeds: [embed] });
	}
}
