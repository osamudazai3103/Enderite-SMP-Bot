import { MessageCommand, MessageCommandData } from '#app/structures/index.js';
import { Command } from '#app/utils/index.js';
import type { Message } from 'discord.js';

@Command<MessageCommandData>({
	description: "Check the bot's ping.",
	aliases: ['s']
})
export default class extends MessageCommand {
	async messageRun(message: Message) {
		const latency = Date.now() - message.createdTimestamp;
		message.reply(`Latency: ${latency}ms\nWebsocket: ${this.client.ws.ping}ms`);
	}
}
