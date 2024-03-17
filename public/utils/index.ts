import type { Client } from 'discord.js';
/**
 * Yêu cầu data từ client. Promise reject khi timeout.
 * @returns
 */
export async function requestClient(callback: (client: Client) => any, timeout = 5000) {
	const nonce = Date.now();
	process.send?.({ callback: callback.toString(), nonce });

	return new Promise((res, rej) => {
		const timer = setTimeout(() => {
			process.off('message', callback);
			rej(null);
		}, timeout).unref();

		const callback = (msg: ClientMessage) => {
			if (msg.nonce === nonce) {
				res(msg);

				clearTimeout(timer);
				process.off('message', callback);
			}
		};
		process.on('message', callback);
	});
}

export interface ClientMessage {
	nonce: number;
	data: any;
}