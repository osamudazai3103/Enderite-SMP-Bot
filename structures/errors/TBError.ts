import { bold, Constructable } from 'discord.js';
import { default as Messages } from './ErrorMessages.js';

const messages = new Map<number, MessageKey>();

type MessageKey = string | ((...args: any[]) => string);
type ErrorKey = keyof typeof Messages;

export function makeError(Base: Constructable<Error>) {
	return class TBError<K extends ErrorKey> extends Base {
		public code: K;

		constructor(
			key: K,
			...args: typeof Messages[K] extends string ? never : Parameters<Exclude<typeof Messages[K], string>>
		) {
			super(message(key, args));
			this.code = key;
			Error.captureStackTrace?.(this, TBError);
		}

		override get name() {
			return `${super.name} [${this.code}]`;
		}

		override set name(value) {
			this.name = value;
		}

		override toString() {
			`\`⚠\` ${bold(this.name)}\n${this.message}`;
		}
	};
}

function message(key: ErrorKey, args: unknown[]) {
	const msg = messages.get(key);
	if (!msg) throw new Error(`An invalid error message key was used: ${key}.`);
	if (typeof msg === 'function') return msg(...args);
	if (!args?.length) return msg;
	args.unshift(msg);
	return String(...args);
}

function register(sym: number, val: any) {
	messages.set(sym, typeof val === 'function' ? val : String(val));
}

for (const [name, message] of Object.entries(Messages)) {
	register(Number(name), message);
}

const TBError = makeError(Error);
const TBTypeError = makeError(TypeError);
const TBRangeError = makeError(RangeError);

export { TBRangeError, TBTypeError, TBError };
export * from './ErrorCodes.js';
