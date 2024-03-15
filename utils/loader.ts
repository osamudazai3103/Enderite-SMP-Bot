import { Stores } from "#app/plugins/stores.js";
import { Client } from "discord.js";
import { glob } from "glob";
import { pathToFileURL } from "node:url";

export async function registerPlugins(client: Client, path: string) {
	const paths = glob.sync(path).map(i => pathToFileURL(i).toString());
    const plugins = paths.map((i) => Stores.preload(i));

	for await (const { name, exports } of plugins) {
        const item = exports['default'] ?? Object.values(exports).at(0);
		let toBeAssigned = typeof item === 'function' ? Reflect.construct(item, [client]) : item;
		Reflect.set(client, name, toBeAssigned);
	}

    console.log(`Registered ${plugins.length} plugins`)
}

