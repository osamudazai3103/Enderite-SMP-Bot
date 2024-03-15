import 'discord.js';
declare module 'discord.js' {
	interface Client {
		database: typeof import('./plugins/database.ts').default;
		stores: import('./plugins/stores.ts').Stores;
	}
}

import { InventoryEntry, ItemEntry } from './structures/index.ts';
import { Result } from '@sapphire/result';
import { Message } from 'discord.js';
import { Awaitable } from '@tb-chan/arguments';

export type Constructable<T> = abstract new (...args: any) => T;

export interface Inhibitor {
	handle?: (message: Message, arg: any) => any;
	trigger: (message: Message) => Awaitable<Result<any, any>>;
	priority?: number;
}