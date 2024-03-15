import { Base, Client } from 'discord.js';
import { cloneDeep } from 'lodash-es';

export class PatchableObject extends Base {
	constructor(client: Client<true>, data: any) {
		super(client);

		this._patch(data);
	}

	_patch(data: any) {
		if (typeof data !== 'object') throw new Error('Expected an instance of object.');
		const keys = Object.keys(data);

		for (const key of keys) {
			Reflect.set(this, key, typeof data[key] === 'object' ? cloneDeep(data[key]) : data[key]);
		}
	}
}
