import type { Awaitable, Client, Message } from 'discord.js';
import { BaseAPICommand, BaseCommand, CommandType } from './BaseCommand.js';
import { generateCommandSyntax, Arguments, ResolvedArguments } from '@tb-chan/arguments';

export abstract class MessageCommand extends BaseCommand {
	declare data: MessageCommandData;
	parent?: MessageCommand;
	subcommands?: MessageCommand[];

	constructor(client: Client, data: BaseAPICommand<MessageCommandData>) {
		super(client, data);
	}

	override type = CommandType.Message;

	get syntax() {
		if (this.data.name instanceof RegExp) return 'No syntax available.'
		//@ts-expect-error
		return generateCommandSyntax(this.data);
	}

	/**
	 * Chạy function này khi có message.
	 * @param message
	 */
	abstract messageRun?(message: Message, args: ResolvedArguments): Awaitable<unknown>;

	/**
	 * Whether this command supports message.
	 * @returns {boolean}
	 */
	public supportMessage(): this is IMessageCommand {
		return Reflect.has(this, 'messageRun');
	}

	override onLoad() {
		super.onLoad();
		this.subcommands = this.data.subcommands?.map((subcommand: typeof MessageCommand) => {
			const constructed = Reflect.construct(subcommand, [this.client]);
			Reflect.set(constructed, 'parent', this);
			const prev = constructed.syntax;
			Reflect.defineProperty(constructed, 'syntax', {
				get: () => {
					
					return `${this.syntax} ${prev}`;
				}
			});

			return constructed as MessageCommand;
		});
	}
}

export type IMessageCommand = MessageCommand & Required<Pick<MessageCommand, 'messageRun'>>;

export interface MessageCommandData {
	name: string | RegExp;
	description?: string;
	arguments?: Arguments;
	subcommands?: typeof MessageCommand[];
	aliases?: string[];
}
