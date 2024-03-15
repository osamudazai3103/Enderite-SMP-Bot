import type { Message } from 'discord.js';
import type { Inhibitor } from '#app/typings.js';
import { err, ok } from '@sapphire/result';

export default {
	trigger(message: Message) {
		if (message.webhookId|| message.author.bot || !message.inGuild()) return ok();
		return err();
	},
	handle() {
		return true;
	},
	priority: 0
} as Inhibitor;
