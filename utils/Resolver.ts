import { type StrategyFunction, processArgs } from '@tb-chan/arguments';
import { MessageCommand } from '#app/structures/index.js';
import { Result } from '@sapphire/result';

export function subcommandStrategy(): StrategyFunction {
	return async (arg, resolver, resolvable, args, _, resolved) => {
		const subcommand = (await resolver.call(null, arg.value, resolvable)) as Result<MessageCommand, Error>;

		if (subcommand.isOk()) {
			const constructed = subcommand.unwrap();
			const command = constructed.data;

			const cmdArgs = await processArgs({
				args,
				//@ts-expect-error
				command,
				//@ts-expect-error
				resolvable: { ...resolvable, command },
				state: resolved
			});
			Object.assign(cmdArgs, resolved);

			if (constructed.supportMessage()) {
				return Result.ok(constructed.messageRun.bind(constructed, resolvable.message, cmdArgs));
			}
		}

		return subcommand;
	};
}