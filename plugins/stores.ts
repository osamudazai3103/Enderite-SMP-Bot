import { pathToFileURL } from 'node:url';
import { glob } from 'glob';
import { type ParsedPath, default as nodePath } from 'node:path';
import { Module } from 'node:module';
import { Inhibitor, type Constructable } from '#app/typings.js';
import { Client, Collection } from 'discord.js';
import { MessageCommand } from '#app/structures/index.js';
import { isNativeFunction } from '#app/utils/index.js';

export class Stores extends Collection<string, Store<any>> {
	client: Client;

	constructor(client: Client) {
		super();
		this.client = client;
	}

	register<T, E extends Map<string, T> = Map<string, T>>(id: string, holds: T, storeInitFn?: (stores: Stores) => E) {
		if (this.has(id)) throw new Error(`Store with the '${id}' already existed.`);

		const defaultInitFn = () => new Collection();
		//@ts-expect-error
		this.set(id, (storeInitFn ?? defaultInitFn)(this));
		const store = this.get(id)!;

		Reflect.set(store, '_holds', holds);
		Reflect.defineProperty(this, id, {
			get: () => {
				return this.get(id);
			}
		});

		return store;
	}

	static resolveURL(str: string) {
		try {
			return new URL(str);
		} catch {
			return pathToFileURL(str);
		}
	}

	static async preload(path: string) {
		const url = this.resolveURL(path);
		const parsed = nodePath.parse(url.toString());

		url.searchParams.append('d', Date.now().toString());
		url.searchParams.append('name', parsed.name);
		url.searchParams.append('extension', parsed.ext);

		try {
			const exports = await import(url.toString()) as Record<string, any>;
			return { url, ...parsed, exports };
		} catch (err) {
			console.error(err);
			process.exit(0);
		}
	}

	async load(id: string, path: string) {
		const { exports, name, ...meta } = await Stores.preload(path);
		const store = this.resolve(id);

		for (let [key, item] of Object.entries(exports)) {
			try {
				let assign = null;

				if (isNativeFunction(store._holds)) {
					if (item.constructor.name !== store._holds.name) continue;
					if (typeof item === 'object') Reflect.set(item, '_meta', { ...meta, name });

					assign = item;
				} else if (item.prototype instanceof store._holds) {
					const constructed = this.construct(item, [this.client]);
					Reflect.set(constructed, '_meta', { ...meta, name });

					constructed.onLoad?.();
					assign = constructed;
				} else continue;

				if (key === 'default') {
					store.set(name, assign);
					continue;
				}
				store.set(key, assign);
			} catch (err: any) {
				err.message = `An error occured when loading module: ${err.message}`;
				err.path = meta.url.toString();
				err.storeId = id;

				throw err;
			}
		}

		return this;
	}

	construct<T>(item: Constructable<T>, args: any[]) {
		const instance = Reflect.construct(item, args);
		return instance;
	}

	resolve(id: string) {
		const store = this.get(id);
		if (!store) throw new Error(`No store exists with the id ${id}`);

		return store;
	}

	async loadMany(id: string, pattern: string) {
		const filePaths = glob.sync(pattern, { absolute: true }).map((i) => pathToFileURL(i).toString());
		if (!filePaths.length) console.warn(`Given pattern '${pattern}' did not match any files.`);

		await Promise.all(filePaths.map((path) => this.load(id, path)));
		return this;
	}

	async unload(storeId: string, id: string) {
		const store = this.resolve(storeId);
		const item = store.get(id);

		await item.onUnload?.();

		//@ts-expect-error
		Reflect.deleteProperty(Module._cache, item._meta.url.toString());
		store.delete(id);

		return item;
	}

	unloadMany(storeId: string, ids: string[]) {
		return Promise.all(ids.map((id) => this.unload(storeId, id)));
	}
}

export interface Stores {
	commands: Store<MessageCommand>;
	inhibitors: Store<Inhibitor>;
}

export interface Loadable {
	onLoad(): any;
	onUnload(): any;
	new (client: Client, ...args: any[]): any;
	_meta?: FileMetadata;
}

export type FileMetadata = ParsedPath & { url: URL };

export interface Store<T> extends Collection<string, T> {
	_holds: Constructable<T>;
}
