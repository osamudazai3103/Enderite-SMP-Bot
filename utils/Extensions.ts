/*
Howw to extend Classes:

- All methods of the Extensions class has to use @ApplyToClass decorator.
- The first parameter will be passed a prototype of the target class, or the target class itself `makeStatic: true`
Other parameters can be added from the 2rd param onwards.
- The value of `this` is the Extensions class.
- Add `isGetter: true` to ApplyToClass parameters to make the function a getter.
*/

import type { Constructable } from '#app/typings.js';
import { Message, type MessageReplyOptions } from 'discord.js';

export class Extensions {
	//@ts-expect-error
	@ApplyToClass([Message])
	async ephemeral(message: Message, options: MessageReplyOptions & { timeout?: number }): Promise<void> {
		return new Promise((res, rej) => {
			return message
				.reply(options)
				.then((msg) => {
					res();
					setTimeout(() => {
						msg.delete().catch(() => null);
					}, options.timeout);
				})
				.catch(rej);
		});
	}
}

export type ExtractParameters<T extends Function> = T extends ($1: any, ...args: infer S) => infer I
	? (...args: S) => I
	: never;

declare module 'discord.js' {
	interface Message {
		ephemeral: ExtractParameters<Extensions['ephemeral']>;
	}
}

export function ApplyToClass(targetClasses: Constructable<any>[], options: ApplyToClassOptions = {}): MethodDecorator {
	const { makeStatic = false, isGetter = false } = options;

	return (target: any, key: string | symbol) => {
		const functionToApply = Reflect.get(target, key) as Function;

		if (isGetter && functionToApply.length > 1) throw new Error('Getter can not have more than 1 parameter.')
		for (const targetClass of targetClasses) {
			const defineTarget = makeStatic ? targetClass : targetClass.prototype;

			Object.defineProperty(defineTarget, key, {
				get() {
					return isGetter ? functionToApply.call(target, this) : functionToApply.bind(target, this);
				},
				enumerable: false
			});
		}
	};
}

type ApplyToClassOptions = {
	makeStatic?: boolean;
	isGetter?: boolean;
};