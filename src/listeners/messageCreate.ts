import { Listener, MessageCommand, TBError } from '#app/structures/index.js';
import { formatError } from '#app/utils/index.js';
import { ParseError, findCommand, parseInput, processArgs } from '@tb-chan/arguments';
import { type Client, type Message } from 'discord.js';

export default class extends Listener<'messageCreate'> {
	constructor(client: Client) {
		super(client, { name: 'messageCreate' });
	}

	public async run(message: Message<true>) {
		if (await runInhibitors(message)) return;

		const args = parseInput(message.content, '.');
		if (!args) return;

		const command = findCommand({
			commands: message.client.stores.commands.filter((i) => !(i.data.name instanceof RegExp)),
			args,
			mapAlias: (i: MessageCommand) => i.data.aliases ?? []
		});

		if (!command) return;

		try {
			const resolvable = {
				message,
				guild: message.guild,
				command: command.data,
				locateSubcommands: () => command.subcommands,
				locateCommand: (input: string) =>
					command.subcommands!.find((e) => {
						if (e.data.name instanceof RegExp) {
							return e.data.name.test(input);
						}

						return e.data.name.toLowerCase() === input.toLowerCase();
					}),
				display: (command: MessageCommand) => `- \`${command.data.name}\`: ${command.data.description}`
			};
			
			//@ts-expect-error
			const resolved = await processArgs({ command: command.data, args, resolvable });

			if (command.supportMessage()) {
				await message.channel.sendTyping().catch(() => {});
				await command.messageRun.call(command, message, resolved);
			}
		} catch (err: any) {
			const isTBError = err instanceof TBError || err instanceof ParseError;
			//@ts-expect-error
			if (!isTBError) process.emit('unhandledRejection', err, message);
			message.ephemeral({ content: formatError(err, true, !isTBError), timeout: 10000 });
		}
	}
}

export async function runInhibitors(message: Message): Promise<boolean> {
	const inhibitorStore = message.client.stores.inhibitors;
	if (!inhibitorStore.size) return false;

	inhibitorStore.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));

	const results = (await Promise.all(
		inhibitorStore.map(async (inhibitor, identifier) => [identifier, await inhibitor.trigger(message)])
	)) as [string, any][];

	const positives = results.filter(([, result]) => result.isOk());
	if (!positives.length) return false;

	for (const res of positives) {
		const [id, result] = res;
		const { handle } = inhibitorStore.get(id)!;

		const block = await handle?.(message, result.unwrap());
		if (Boolean(block)) return Boolean(block);
	}

	return false;
}
