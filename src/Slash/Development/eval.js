module.exports = {
	name: "eval",
	description: "Evalulate some code.",
	category: "Development",
	elevatedPermissions: true,
    options: [],
	async execute(interaction, client) {
		if (!interaction.isCommand()) return;
		const discordModals = require('discordjs-modal')
		discordModals(client)
		const {
			Modal,
			TextInput
		} = require('discordjs-modal')

    const Database = require("@replit/database")
    const db = new Database()
		const modal = new Modal()
			.setCustomId('eval-modal')
			.setTitle('Eval Code')
			.addComponents(
				new TextInput()
				.setCustomId('eval-code')
				.setLabel('The Code')
				.setStyle("Paragraph")
				.setMaxLength(1024)
				.setPlaceholder('Start from here...')
				.setRequired(true),
			);

		client.modal.send(interaction, modal)
	},
};