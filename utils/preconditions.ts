import { TBError, TBErrorCode } from '#app/structures/index.js';
import { splitPascalCase } from '#app/utils/index.js';
import { Result, err, ok } from '@sapphire/result';
import { DurationFormatter } from '@sapphire/time-utilities';
import {
	Message,
	type CommandInteraction,
	type Awaitable,
	ChannelType,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	type PermissionResolvable,
	UserContextMenuCommandInteraction,
	inlineCode,
	BaseInteraction
} from 'discord.js';

export function DevOnly(): PreconditionFunction {
	return Users(['792645340632317992']);
}

export function Command<T>(options: Omit<T, 'name'>): ClassDecorator {
	return (target) => {
		return new Proxy(target, {
			construct(target, argArray) {
				const [client, data] = argArray;

				return Reflect.construct(target, [client, { data: options, ...data }]);
			}
		});
	};
}

export function Preconditions(preconditionFns: PreconditionFunction[]): MethodDecorator {
	return (target, _key, descriptor) => {
		if (!descriptor.value || !(typeof descriptor.value === 'function'))
			throw new Error('Đối tượng phải là 1 function.');

		const org = descriptor.value;
		const returnValue: Record<string, any> = {};

		const fn = async function (...args: Parameters<PreconditionFunction>) {
			for (const func of fn.preconditions) {
				const result = await func.apply(target, args);

				if (result.isErr()) {
					throw result.unwrapErr();
				}

				Reflect.set(returnValue, func.name, result.unwrap());
			}

			return org.apply(target, args);
		}.bind(target) as DecoratedFn;

		fn.preconditions = preconditionFns;
		const proxy = new Proxy(fn, {
			apply(target, thisArg, argArray) {
				Reflect.set(argArray[1] ?? {}, '_preconditions', returnValue);
				return target.call(thisArg, ...argArray);
			}
		});
		//@ts-expect-error
		descriptor.value = proxy;
	};
}

type DecoratedFn = {
	(...args: any[]): any;
	preconditions: Function[];
};

export const formatPermissions = (permissions: PermissionResolvable[]) =>
	permissions.map((i) => inlineCode(splitPascalCase(i.toString())!)).join(', ');
export const formatChannelTypes = (channelTypes: ChannelType[]) =>
	channelTypes.map((i) => inlineCode(splitPascalCase(ChannelType[i])!)).join(', ');

export type PreconditionFunction = (
	messageOrInteraction:
		| Message<true>
		| ChatInputCommandInteraction<'cached'>
		| ContextMenuCommandInteraction<'cached'>
		| UserContextMenuCommandInteraction<'cached'>
) => Awaitable<Result<unknown, Error>>;

export function Cooldown(options: CooldownOptions): PreconditionFunction {
	const buckets = new Map<string, number>();

	return function Cooldown(messageOrInteraction) {
		let identifier =
			messageOrInteraction instanceof Message
				? getIdFromMessage(messageOrInteraction, options)
				: getIdFromInteraction(messageOrInteraction, options);
		const register = () => buckets.set(identifier, Date.now() + options.delay);
		const unregister = () => buckets.delete(identifier);
		if (options.ignore?.includes(identifier)) return ok({ register, unregister });
		const timeout = buckets.get(identifier);
		const now = Date.now();
		if (!timeout) {
			if (!options.manual) buckets.set(identifier, now + options.delay);
			return ok({ register, unregister });
		}
		if (now > timeout) {
			buckets.delete(identifier);
			return ok({ register, unregister });
		} else {
			const remaining = timeout - now;
			const duration = new DurationFormatter().format(remaining);

			return err(
				new TBError(
					TBErrorCode.PreconditionsFailed,
					`This command can only be used a limited number of time in a period of time.\nYou can not use this command for ${duration}.`
				)
			);
		}
	};
}

function getIdFromMessage(message: Message, options: CooldownOptions) {
	switch (options.scope) {
		case CooldownScope.Global:
			return 'global';
		case CooldownScope.Channel:
			return message.channel.id;
		case CooldownScope.Guild:
			return message.guild?.id ?? message.channel.id;
		default:
			return message.author.id;
	}
}

function getIdFromInteraction(interaction: CommandInteraction, options: CooldownOptions) {
	switch (options.scope) {
		case CooldownScope.Global:
			return 'global';
		case CooldownScope.Channel:
			return interaction.channelId!;
		case CooldownScope.Guild:
			return interaction.guildId!;
		default:
			return interaction.user.id;
	}
}

interface CooldownOptions {
	delay: number;
	scope: CooldownScope;
	ignore?: string[];
	manual?: boolean;
}

export enum CooldownScope {
	Global,
	User,
	Channel,
	Guild
}

export function ChannelTypes(channelTypes: ChannelType[]): PreconditionFunction {
	return function ChannelTypes(messageOrInteraction): Result<any, any> {
		if (!messageOrInteraction.inGuild()) return ok();

		if (!channelTypes.includes(messageOrInteraction.channel!.type)) {
			return err(
				new TBError(
					TBErrorCode.PreconditionsFailed,
					`You can not use this command in this channel. Allowed channel(s): ${formatChannelTypes(channelTypes)}`
				)
			);
		}

		return ok();
	};
}

export function Users(
	target: string[] | ((messageOrInteraction: Parameters<PreconditionFunction>[0]) => Awaitable<boolean>)
): PreconditionFunction {
	const error = () => err(new TBError(TBErrorCode.PreconditionsFailed, `You can not use this command.`));

	return async function Users(messageOrInteraction): Promise<Result<any, any>> {
		if (!messageOrInteraction.inGuild()) return ok();

		if (Array.isArray(target)) {
			if (messageOrInteraction instanceof Message) {
				if (!target.includes(messageOrInteraction.author.id)) return error();
			} else {
				if (!target.includes(messageOrInteraction.user.id)) return error();
			}
		} else {
			const result = target(messageOrInteraction);
			if (!result) return error();
		}

		return ok();
	};
}

export function Channels(
	target: string[] | ((messageOrInteraction: Parameters<PreconditionFunction>[0]) => Awaitable<boolean>)
): PreconditionFunction {
	const error = () => err(new TBError(TBErrorCode.PreconditionsFailed, `You can not use this command in this channel.`));

	return async function Channels(messageOrInteraction): Promise<Result<any, any>> {
		if (!messageOrInteraction.inGuild()) return ok();

		if (Array.isArray(target)) {
			if (!target.includes(messageOrInteraction.channelId)) return error();
		} else {
			const result = target(messageOrInteraction);
			if (!result) return error();
		}

		return ok();
	};
}

export function UserPermissions(permissions: PermissionResolvable[]): PreconditionFunction {
	return function UserPermissions(messageOrInteraction): Result<any, any> {
		if (!messageOrInteraction.inGuild()) return ok();

		const returnErr = () => err(new TBError(TBErrorCode.MissingPermissions, 'You', formatPermissions(permissions)));

		if (messageOrInteraction instanceof BaseInteraction) {
			if (!messageOrInteraction.memberPermissions.has(permissions)) return returnErr();
		} else {
			if (!messageOrInteraction.channel.permissionsFor(messageOrInteraction.author.id)?.has(permissions))
				return returnErr();
		}

		return ok();
	};
}

export function ClientPermissions(permissions: PermissionResolvable[]): PreconditionFunction {
	return async function ClientPermissions(messageOrInteraction): Promise<Result<any, any>> {
		if (!messageOrInteraction.inGuild()) return ok();

		const returnErr = () =>
			err(new TBError(TBErrorCode.MissingPermissions, 'Mình', formatPermissions(permissions)));

		if (messageOrInteraction instanceof BaseInteraction) {
			if (!messageOrInteraction.appPermissions?.has(permissions)) return returnErr();
		} else {
			try {
				const me = await messageOrInteraction.guild.members.fetchMe();

				if (!messageOrInteraction.channel.permissionsFor(me).has(permissions)) return returnErr();
			} catch (error: any) {
				return err(new TBError(TBErrorCode.UserError, error.message));
			}
		}

		return ok();
	};
}

