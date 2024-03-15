import type { Client } from 'discord.js';
import { defaults, last } from 'lodash-es';

import { Module } from 'node:module';
import { fileURLToPath } from 'node:url';

import type { DeepRequired } from 'utility-types';
import type { Loadable } from '#app/plugins/stores.js';

export abstract class BaseCommand implements BaseAPICommand, Loadable {
	public path!: string;
	public type: CommandType = 0;
	public readonly data: BaseAPICommand['data'];
	public readonly restraints: DeepRequired<BaseAPICommand['restraints']>;
	public client!: Client;

	constructor(client: Client, data: BaseAPICommand = { data: {} }) {
		Reflect.set(this, 'client', client);
		const { data: commandData, restraints } = data;

		this.data = commandData;
		//@ts-expect-error
		this.restraints = defaults(restraints, BaseCommand.defaultRetraints);
	}

	abstract get syntax(): string;

	get category() {
		return last(this._meta!.dir.split('/'))!;
	}

	static get defaultRetraints(): BaseAPICommand['restraints'] {
		return {
			dmPermission: false,
			global: true,
			enabled: true
		};
	}

	onLoad() {
		if (!this.data.name) this.data.name = this._meta!.name;
	}

	onUnload() {
		//@ts-expect-error
		Reflect.deleteProperty(Module._cache, fileURLToPath(this._meta!.url));
	}
}

export interface BaseCommand extends Loadable {}

export interface BaseAPICommand<T = any> {
	data: T;
	restraints?: {
		global?: boolean;
		dmPermission?: boolean;
		enabled?: boolean;
	};
}

export enum CommandType {
	Unknown,
	Slash,
	Message
}
