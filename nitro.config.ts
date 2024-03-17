import { defineNitroConfig } from 'nitropack';

export default defineNitroConfig({
	plugins: [],
	output: { dir: '../dist/public' },
	srcDir: './public',
	typescript: { generateTsConfig: false, internalPaths: false },
	timing: true,
	noPublicDir: true,
	minify: true
});