export class Interval {
	callback: Callback;
	_interval!: NodeJS.Timer;
	interval: number;
	lastInterval!: number;
	remaining: number | null = null;

	constructor(callback: Callback, interval: number, immediate: boolean = true) {
		this.callback = () => {
			this.lastInterval = Date.now();
			callback();
		};

		this.interval = interval;
		this.initialize(immediate);
	}

	get nextInvocation() {
		return this.lastInterval + this.interval;
	}

	private initialize(immediate: boolean = true) {
		this.lastInterval = Date.now();
		//@ts-ignore
		this._interval = setInterval(this.callback, this.interval).unref();
		if (!immediate) this.pause();
	}

	invoke() {
		this.lastInterval = Date.now();

		this._interval.refresh();
		this.callback();
	}

	pause() {
		const des = this.nextInvocation;
		this.remaining = des - Date.now();
		this.stop();
	}

	play() {
		if (!this.remaining) throw new Error('This interval was not paused before.');

		//@ts-ignore
		this._interval = {}

		setTimeout(() => {
			this.callback();
			this.initialize();
		}, this.remaining);

		this.remaining = null;
	}

	cancelNext() {
		this.lastInterval = Date.now();
		this._interval.refresh();
	}

	stop() {
		//@ts-ignore
		clearInterval(this._interval);
		//@ts-ignore
		this._interval = null;
	}
}

type Callback = (...args: any) => any;
