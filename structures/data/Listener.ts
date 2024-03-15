import type { Client, ClientEvents } from 'discord.js';
import type { EventEmitter } from 'node:events';
import { Result } from '@sapphire/result';
import { type Loadable } from '#app/plugins/stores.js';

type EventName = keyof ClientEvents;

//@ts-expect-error
export abstract class Listener<E extends EventName> implements Loadable {
	public emitter: EventEmitter;
	public once: boolean;
	public name: E;
	private _listener: ((...args: any[]) => void) | null;
	public path?: string;
	public core: boolean;

	constructor(client: Client, data: ListenerConstructor<E>) {
		//@ts-expect-error
		this.emitter =
			typeof data.emitter === 'undefined'
				? client
				: (typeof data.emitter === 'string'
						? (Reflect.get(client, data.emitter) as EventEmitter)
						: data.emitter) ?? null;

		this.once = data.once ?? false;
		this.name = data.name as E;
		this._listener = this.emitter && this.name ? this._run.bind(this) : null;
		this.core = data.core ?? false;
	}

	public abstract run(...args: ClientEvents[E]): unknown;

	private async _run(...args: unknown[]) {
		//@ts-expect-error
		return await Result.fromAsync(() => this.run(...args));
	}

	/**
	 * Unload this event from the emitter.
	 */
	public onUnload() {
		if (this._listener) {
			const emitter = this.emitter!;

			// Decrement the maximum amount of listeners by one:
			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners - 1);

			emitter.off(this.name, this._listener);
			this._listener = null;
		}
	}

	/**
	 * Listen to this event from the emitter.
	 */
	public onLoad() {
		if (this._listener) {
			const emitter = this.emitter!;

			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);

			emitter[this.once ? 'once' : 'on'](this.name, this._listener);
		}
	}
}

interface ListenerConstructor<E> {
	once?: boolean;
	name: E;
	core?: boolean;
	emitter?: keyof Client | EventEmitter;
}