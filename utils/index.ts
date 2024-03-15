import { ParseError } from '@tb-chan/arguments';
import {
	ActionRowBuilder,
	type APIEmbed,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	Client,
	ComponentType,
	ContextMenuCommandInteraction,
	GuildMember,
	type Interaction,
	type InteractionCollectorOptions,
	Message,
	MessageComponentInteraction,
	type MessageReplyOptions,
	ModalSubmitInteraction,
	User,
	codeBlock,
	escapeMarkdown,
	hyperlink,
	GuildMemberResolvable
} from 'discord.js';
import { isFunction } from 'lodash-es';
import { Pagination, type PaginationOptions } from './Pagination.js';
import { inspect } from 'util';

export function resolveValue<T = any>(i: T | ((...args: any) => T), ...args: any[]) {
	return isFunction(i) ? i(...args) : i;
}

export function runOnClientReady(client: Client<boolean>, fn: Function) {
	if (client.isReady()) {
		client.once('ready', () => fn());
	} else {
		return fn();
	}
}

export function createImageEmbed(url: string): APIEmbed {
	return {
		image: { url }
	};
}

export const Filters = {
	base(context: User | GuildMember) {
		return async (i: MessageComponentInteraction) => {
			if (i.user.id === context.id) return true;
			else {
				i.reply({ content: 'Not your menu.', ephemeral: true });
				return false;
			}
		};
	},
	modal(
		interaction: MessageComponentInteraction | ChatInputCommandInteraction | ContextMenuCommandInteraction,
		customId: string
	) {
		return (m: ModalSubmitInteraction) =>
			interaction.inCachedGuild() && m.user.id === interaction.user.id && m.customId === customId;
	}
};

export const PromptRow = new ActionRowBuilder<ButtonBuilder>().setComponents([
	new ButtonBuilder().setCustomId('tbchan:prompt/allow').setLabel('Yes').setStyle(ButtonStyle.Success),
	new ButtonBuilder().setCustomId('tbchan:prompt/deny').setLabel('No').setStyle(ButtonStyle.Danger)
]);

export async function prompt(
	message: Message,
	options: MessageReplyOptions & Omit<InteractionCollectorOptions<ButtonInteraction>, 'componentType'>
) {
	const rep = await message.reply({ ...options, components: [...Array.from(options.components ?? []), PromptRow] });

	const result = await handlePrompt(rep, options);
	rep.delete().catch(() => null);
	return result;
}

export async function handlePrompt(
	message: Message,
	options: Omit<InteractionCollectorOptions<ButtonInteraction>, 'componentType'>
) {
	return new Promise<boolean>((resolve) => {
		message
			.awaitMessageComponent({ ...options, componentType: ComponentType.Button })
			.then(async (i) => {
				await i.deferUpdate();
				if (i.customId === 'tbchan:prompt/allow') {
					resolve(true);
				} else if (i.customId === 'tbchan:prompt/deny') resolve(false);
			})
			.catch(() => {
				resolve(false);
			});
	});
}

export async function paginate<T>(
	message: Message,
	options: PaginationOptions<T> & {
		transform?: Parameters<Pagination<T>['transformPages']>[0];
		idle?: number;
		options?: MessageReplyOptions;
		handle?: (interaction: Interaction, pagination: Pagination<any>) => any;
	}
) {
	const row = renderPaginationRow();
	const pagination = new Pagination<T>(options);

	const resolveComponents = () => (options.options?.components ?? []).map((i) => resolveValue(i, pagination));

	const updateIndex = () => row.components[2].setLabel(pagination.getIndex().join('/'));
	const updateRow = () => {
		const disablePrev = pagination.currentIndex === 0;
		const disableNext = pagination.maxPagesIndex === pagination.currentIndex;

		[row.components[0], row.components[1]].map((i) => i.setDisabled(disablePrev));
		[row.components[3], row.components[4]].map((i) => i.setDisabled(disableNext));
	};

	if (options.transform) {
		pagination.transformPages(options.transform);
	}

	updateIndex();
	updateRow();

	const response = await message.reply({
		...options.options,
		//@ts-ignore
		embeds: [...pagination.getCurrentPage(), ...(options.options?.embeds ?? [])],
		components: [...resolveComponents(), row]
	});

	const collector = response.createMessageComponentCollector({
		idle: options.idle,
		filter: Filters.base(message.author)
	});
	collector.on('collect', (interaction) => {
		options.handle?.(interaction, pagination);
		if (interaction.isButton()) {
			if (!interaction.customId.startsWith('tbchan:pagination/')) return;
			switch (interaction.customId) {
				case 'tbchan:pagination/previous':
					pagination.previousPage();
					break;
				case 'tbchan:pagination/next':
					pagination.nextPage();
					break;
				case 'tbchan:pagination/first':
					pagination.firstPage();
					break;
				case 'tbchan:pagination/last':
					pagination.lastPage();
					break;
			}

			updateIndex();
			updateRow();

			interaction
				.update({
					embeds: pagination.getCurrentPage() as any,
					components: [...resolveComponents(), row]
				})
				.catch(() => null);
		}
	});
	collector.on('end', () => {
		response.delete().catch(() => null);
	});

	return response;
}
export function renderPaginationRow() {
	const Buttons = {
		first: new ButtonBuilder().setCustomId('tbchan:pagination/first').setLabel('<<').setStyle(ButtonStyle.Primary),
		prev: new ButtonBuilder().setCustomId('tbchan:pagination/previous').setLabel('<').setStyle(ButtonStyle.Primary),
		index: new ButtonBuilder()
			.setCustomId('tbchan:pagination/index')
			.setLabel('0/0')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		next: new ButtonBuilder().setCustomId('tbchan:pagination/next').setLabel('>').setStyle(ButtonStyle.Primary),
		last: new ButtonBuilder().setCustomId('tbchan:pagination/last').setLabel('>>').setStyle(ButtonStyle.Primary)
	};

	return new ActionRowBuilder<ButtonBuilder>().setComponents(Object.values(Buttons));
}

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatError<T extends Error>(err: T, stack: boolean = false, showFull = false) {
	let msg = `\`⚠\` **${err.name}**\n${err.message}`;
	if (err instanceof ParseError) {
		stack = false;
		msg += `\n${codeBlock(err.syntax)}`;
		return msg;
	}

	if (stack) msg += `\n\`\`\`${showFull ? inspect(err, { depth: null }) : err.stack!}\`\`\``;

	return msg;
}
export function flatten(obj: any, roots = [], sep = '.'): any {
	return Object.keys(obj).reduce(
		(memo, prop) =>
			Object.assign(
				{},
				memo,
				Object.prototype.toString.call(obj[prop]) === '[object Object]'
					? flatten(obj[prop], roots.concat([prop] as any), sep)
					: { [roots.concat([prop] as any).join(sep)]: obj[prop] }
			),
		{}
	);
}

export function isSnowflake(str: string) {
	return /^\d{17,22}$/g.test(str);
}

export function isEmpty(obj: any) {
	return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype;
}

export function splitPascalCase(word: string) {
	const wordRe = /($[a-z])|[A-Z][^A-Z]+/g;
	return word.match(wordRe)?.join(' ');
}

export function isNativeFunction(fn: Function) {
	return /\{\s+\[native code\]/.test(Function.prototype.toString.call(fn));
}

export function formatMember(member: GuildMemberResolvable) {
	if (member instanceof User)
		return hyperlink(escapeMarkdown(member.username), `https://discord.com/users/${member.id}`);

	if (typeof member === 'string') return hyperlink('Unavailable', `https://discord.com/users/${member}`);

	if (member instanceof GuildMember)
		return hyperlink(
			escapeMarkdown(member.displayName),
			`https://discord.com/users/${member.id}/profile?with_mutual_guilds=true&with_mutual_friends_count=true&guild_id=${member.guild.id}`
		);
	return null;
}

export function* splitNParts(num: number, parts: number) {
	let sumParts = 0;
	const half = Math.trunc(num / 2.5);
	for (let i = 0; i < parts - 1; i++) {
		let pn = Math.ceil(Math.random() * (num - sumParts));
		if (pn > half) pn = half;
		yield pn;
		sumParts += pn;
	}
	yield num - sumParts;
}

export * from './preconditions.js';
export * from './Pagination.js';
export * from './Resolver.js';
export * from './loader.js';
