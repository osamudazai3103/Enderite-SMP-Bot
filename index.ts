import { Client, type ClientOptions, GatewayIntentBits, Options, Partials, ActivityType } from 'discord.js';
import { config as configEnv } from 'dotenv';
import { registerPlugins } from '#app/utils/loader.js';
import { MessageCommand, Listener } from './structures/index.js';
import { readdirSync } from 'fs';
import './package.json' assert { type: 'json' };
import type { Constructable } from './typings.js';
configEnv();
import { spawn } from 'child_process';
import '#app/utils/Extensions.js';

const SpawnServer = true;
const Config: ClientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	],
	allowedMentions: { repliedUser: false, parse: [] },
	partials: [Partials.User, Partials.Message, Partials.GuildMember],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		ThreadMemberManager: 0,
		MessageManager: 50
	}),
	presence: {
		activities: [{ name: 'Enderite SMP', type: ActivityType.Watching }]
	}
};

const client = new Client(Config);
await registerPlugins(client, './plugins/*.js');


if (SpawnServer) {
	const nitroProcess = spawn('node', ['public/server/index.mjs'], {
		stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
		serialization: 'json',
		cwd: process.cwd()
	});

	nitroProcess.on('message', (payload: any) => {
		console.log(eval(payload.callback));
		const result = eval(payload.callback).call(global, client);

		nitroProcess.send({ nonce: payload.nonce, data: result });
	});
}

const stores: { [key: string]: Constructable<any> } = {
	commands: MessageCommand,
	listeners: Listener,
	inhibitors: Object
};

// Load plugins.
readdirSync('./src/', { withFileTypes: true }).forEach((i) => {
	if (i.isDirectory()) {
		const hold = stores[i.name];
		const store = client.stores.register(i.name, hold);
		console.log(`Registered store '${i.name}' with type ${hold?.name}`);

		client.stores
			.loadMany(i.name, `./src/${i.name}/**/**.js`)
			.then(() => console.log(`Loaded ${store.size} ${hold.name} into store '${i.name}'`));
	}
});

await client.login(process.env.DISCORD_TOKEN);