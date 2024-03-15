import { chunk, groupBy } from 'lodash-es';
export interface Pagination<T> {
	pages: T[][];
	currentIndex: number;
}

export type PaginationOptions<T> = {
	groupBy: string | number;
	pages?: T[];
	startingPage?: number;
};

export class Pagination<T> {
	constructor(options: PaginationOptions<T>) {
		const { groupBy } = options;

		this.pages = [];
		this.currentIndex = options.startingPage ?? 0;

		if (typeof groupBy === 'number') {
			this.#renderChunks(options.pages, groupBy);
		} else if (typeof groupBy === 'string') {
			this.#groupByProperty(options.pages, groupBy);
		}
	}

	public get maxPagesIndex() {
		return this.pages.length - 1;
	}

	#groupByProperty(array: T[] = [], propertyKey: string) {
		this.pages = Object.values(groupBy(array, propertyKey));

		return;
	}

	public transformPages<N>(fn: (i: T[]) => N): Pagination<N> {
		//@ts-expect-error
		this.pages = this.pages.map((i) => fn(i));
		//@ts-expect-error
		return this;
	}

	public previousPage() {
		this.currentIndex--;
		if (this.currentIndex < 0) this.currentIndex = this.maxPagesIndex;
		return this.getCurrentPage();
	}

	public firstPage() {
		this.currentIndex = 0;
		return this.getCurrentPage();
	}

	public getPage(page: number) {
		return this.pages[page];
	}

	public getIndex() {
		return [this.currentIndex, this.maxPagesIndex].map((i) => i + 1);
	}

	public setPage(page: number) {
		this.currentIndex = page;
	}

	public lastPage() {
		this.currentIndex = this.maxPagesIndex;
		return this.getCurrentPage();
	}

	public nextPage() {
		this.currentIndex++;
		if (this.currentIndex > this.maxPagesIndex) this.currentIndex = 0;
		return this.getCurrentPage();
	}

	public getCurrentPage() {
		return this.getPage(this.currentIndex);
	}

	#renderChunks(array: T[] = [], chunkSize: number = 1) {
		if (chunkSize < 0) throw new Error('Can not have a page size of zero or negative number.');

		this.pages = chunk(array, chunkSize);
	}
}
