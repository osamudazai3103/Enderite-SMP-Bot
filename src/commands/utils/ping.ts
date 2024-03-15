import { MessageCommand } from '#app/structures/index.js';
import type { Message } from 'discord.js';

export default class extends MessageCommand {
	async messageRun(message: Message) {
		const latency = Date.now() - message.createdTimestamp;
		message.reply(`Latency: ${latency}ms\nWebsocket: ${this.client.ws.ping}ms`);
	}
}
