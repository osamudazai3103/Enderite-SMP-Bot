import {
	ChatInputCommandInteraction,
	type Awaitable,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
	AutocompleteInteraction,
	type ApplicationCommandOptionData,
	type LocalizationMap,
	type ApplicationCommandData,
	ApplicationCommandType,
	Client
} from 'discord.js';
import { capitalize, reduce } from 'lodash-es';
import { type BaseAPICommand, BaseCommand, CommandType } from './BaseCommand.js';
export abstract class SlashCommand extends BaseCommand {
	declare data: SlashCommandData;
	override type = CommandType.Slash;

	constructor(client: Client, data: BaseAPICommand<SlashCommandData>) {
		super(client, data);
	}

	get syntax() {
		return `/${this.data.name}`;
	}

	/**
	 * Executes the application command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public chatInputRun?(interaction: ChatInputCommandInteraction<'cached'>): Awaitable<unknown>;

	/**
	 * Executes the message context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public messageContextMenuRun?(interaction: MessageContextMenuCommandInteraction<'cached'>): Awaitable<unknown>;

	/**
	 * Executes the user context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public userContextMenuRun?(interaction: UserContextMenuCommandInteraction<'cached'>): Awaitable<unknown>;

	/**
	 * Executes the autocomplete command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public autocompleteRun?(interaction: AutocompleteInteraction<'cached'>): Awaitable<unknown>;

	public supportChatInput(): this is ChatInputCommand {
		return Reflect.has(this, 'chatInputRun');
	}

	public supportMessageContextMenu(): this is MessageContextMenuCommand {
		return Reflect.has(this, 'messageContextMenuRun');
	}

	public supportUserContextMenu(): this is UserContextMenuCommand {
		return Reflect.has(this, 'userContextMenuRun');
	}

	public supportContextMenu(): this is ContextMenuCommand {
		return Reflect.has(this, 'userContextMenuRun') || Reflect.has(this, 'messageContextMenuRun');
	}

	public supportAutocomplete(): this is AutocompleteCommand {
		return Reflect.has(this, 'autocompleteRun');
	}

	public isGlobal(): boolean {
		return Boolean(this.restraints?.global);
	}

	public toJSON(): ApplicationCommandData[] {
		const data: ApplicationCommandData[] = [];
		const { options, description, name, ...contextMenuCommandData } = this.data;

		const convert = (i: string) => i.replace(/([A-Z])/g, ($1) => '_' + $1.toLowerCase());
		const toSnakeCase = (i: any): any =>
			reduce(
				i,
				(prev, curr, k) => {
					if (!Array.isArray(curr) && typeof curr === 'object') {
						Reflect.set(prev, convert(k), toSnakeCase(curr));
					} else Reflect.set(prev, convert(k), curr);
					return {};
				},
				{}
			);

		if (this.supportContextMenu()) {
			data.push(
				toSnakeCase({
					...contextMenuCommandData,
					name: capitalize(name.replace(/\-/g, '')),
					type: this.supportMessageContextMenu()
						? ApplicationCommandType.Message
						: ApplicationCommandType.User
				})
			);
		}
		if (this.supportChatInput()) {
			data.push(
				toSnakeCase({
					...this.data,
					dmPermission: this.restraints?.dmPermission,
					type: ApplicationCommandType.ChatInput
				})
			);
		}
		return data;
	}
}

export interface SlashCommandData {
	name: string;
	description: string;
	options?: ApplicationCommandOptionData[];
	defaultPermissions?: boolean;
	nameLocalizations?: LocalizationMap;
	descriptionLocalizations?: LocalizationMap;
}

export type ContextMenuCommand = MessageContextMenuCommand | UserContextMenuCommand;

export type MessageContextMenuCommand = SlashCommand & Required<Pick<SlashCommand, 'messageContextMenuRun'>>;

export type UserContextMenuCommand = SlashCommand & Required<Pick<SlashCommand, 'userContextMenuRun'>>;

export type AutocompleteCommand = SlashCommand & Required<Pick<SlashCommand, 'autocompleteRun'>>;

export type ChatInputCommand = SlashCommand & Required<Pick<SlashCommand, 'chatInputRun'>>;
