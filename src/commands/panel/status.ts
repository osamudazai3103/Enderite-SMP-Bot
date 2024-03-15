import { MessageCommand, MessageCommandData } from '#app/structures/index.js';
import { Command } from '#app/utils/index.js';
import { EmbedBuilder, type Message } from 'discord.js';
import { fetch } from 'undici';

@Command<MessageCommandData>({
	description: 'View the current server status.',
	aliases: ['s']
})
export default class extends MessageCommand {
	async messageRun(message: Message) {
		const res = await fetchServerResources();
		const cap = await fetchServerCapacity();

		return message.reply({ embeds: [renderEmbed(res, cap)] });
	}
}

function renderEmbed(res: ServerResources, cap: ServerCapacity) {
	const embed = new EmbedBuilder();
	embed.addFields(
		{ name: 'Status', value: res.current_state },
		{
			name: 'Memory',
			value: `${humanFileSize(res.resources.memory_bytes)}/${humanFileSize(cap.limits.memory * 1024**2)}`,
			inline: true
		},
		{
			name: 'Disk',
			value: `${humanFileSize(res.resources.disk_bytes)}/${humanFileSize(cap.limits.disk * 1024**2)}`,
			inline: true
		},
		{
			name: 'CPU Load',
			value: `${res.resources.cpu_absolute}%/${cap.limits.cpu}%`,
			inline: true
		}
	);
	return embed;
}

async function fetchServerResources(): Promise<ServerResources> {
	const data = await fetchApi('/resources');
	return data.attributes;
}

async function fetchServerCapacity(): Promise<ServerCapacity> {
	const data = await fetchApi();
	return data.attributes;
}
async function fetchApi(path: string = '') {
	const BaseURL = 'https://panel.craftlands.host/api/client/servers/eb682cd0';

	const url = BaseURL + path;
	const data = (await fetch(url, {
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Bearer ptlc_JyPMAPjHzZeWSMTwlcn73Xn8CnDX9qLVyYygUETq2sR'
		}
	}).then((i) => i.json())) as any;
	return data;
}

interface ServerCapacity {
	limits: {
		memory: number;
		swap: number;
		disk: number;
		io: number;
		cpu: number;
		threads: string;
		oom_disabled: boolean;
	};
}

interface ServerResources {
	current_state: string;
	is_suspended: boolean;
	resources: {
		memory_bytes: number;
		cpu_absolute: number;
		disk_bytes: number;
		network_rx_bytes: number;
		network_tx_bytes: number;
		uptime: number;
	};
}

function humanFileSize(size: number) {
	let i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
	return Number((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
