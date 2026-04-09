import { Plugin } from 'obsidian';

export default class CalloutStudioPlugin extends Plugin {
	async onload() {
		console.log('Loading Callout Studio');
	}

	onunload() {
		console.log('Unloading Callout Studio');
	}
}
