const {
	MessageEmbed,
	MessageActionRow,
	MessageButton
} = require('discord.js')
const Database = require("@replit/database")
const db = new Database()


module.exports = {
	name: 'team',
	description: 'Manage and see teams.',
	category: 'Moderation',
	clientPermissions: ["MODERATE_MEMBERS"],
	userPermissions: ["MODERATE_MEMBERS"],
	options: [{
		name: "create",
		description: "Create a team.",
		type: 1,
		options: [{
			name: 'leader',
			description: 'The leader of the team.',
			type: 6,
			required: true
		},
		{
			name: 'name',
			description: 'The name of the team',
			type: 3,
			required: true,
		},
		{
			name: 'color',
			description: 'The color of the team',
			type: 3,
			choices: [{
				name: 'DarkRed',
				value: '#992D22'
			},
			{
				name: 'Red',
				value: '#ED4245'
			},
			{
				name: 'Gold',
				value: '#F1C40F'
			}, {
				name: 'Yellow',
				value: '#FFFF00'
			},
			{
				name: 'DarkGreen',
				value: '#1F8B4C'
			},
			{
				name: 'Green',
				value: '#57F287'
			},
			{
				name: 'Aqua',
				value: '#1ABC9C'
			},
			{
				name: 'DarkAqua',
				value: '1146986'
			},
			{
				name: 'DarkBlue',
				value: '#11806A'
			},
			{
				name: 'DarkBlue',
				value: '#206694'
			},
			{
				name: 'Blue',
				value: '#3498DB'
			},
			{
				name: 'Purple',
				value: '#9B59B6'
			},
			{
				name: 'DarkPurple',
				value: '#206694'
			},
			{
				name: 'White',
				value: '#FFFFFF'
			},
			{
				name: 'Grey',
				value: '#95A5A6'
			},
			{
				name: 'DarkGrey',
				value: '#979C9F'
			},
			{
				name: 'Black',
				value: '#23272A'
			}
			],
			required: true
		}
		]
	},
	{
		name: "addplayer",
		description: "Add a player to a given team.",
		type: 1,
		options: [{
			name: 'user',
			description: 'User to add',
			type: 6,
			required: true
		},
		{
			name: 'name',
			description: 'The name of the team',
			type: 3,
			required: true
		}
		]
	}
	],

	async execute(interaction) {
		const {
			client,
			options,
			member,
			guild
		} = interaction
		const user = options.getUser('leader')
		const subcommand = options.getSubcommand()
		const name = options.getString('name')

		await db.get('Teams.Shadows.members').then(ob => {
			console.log(ob)
		})
		if (subcommand === 'create') {

			const leader = options.getMember('leader')
			const color = options.getString('color')
			db.get(`Teams.${name}`).then(async (team) => {
				console.log(team)
				if (team) return interaction.reply({
					embeds: [
						new MessageEmbed()
							.setTitle('Team Exists')
							.setDescription(`The team \`${name}\` already exists.`)
							.setColor('RED')
					]
				})
				const teamRole = await guild.roles.create({
					name: name,
					color: color,
					reason: `Team created by ${member.user.tag}`
				})
				const teamChannel = await guild.channels.create(name, {
					type: 'GUILD_TEXT',
					reason: `Team created by ${member.user.tag}`,
					permissionOverwrites: [{
						id: guild.id,
						deny: ['VIEW_CHANNEL']
					},
					{
						id: teamRole.id,
						allow: ['VIEW_CHANNEL']
					},
					{
						id: leader.id,
						allow: ['VIEW_CHANNEL']
					}
					]
				})
				const mem = await guild.members.fetch(user.id)
				mem.roles.add(teamRole)

				await db.set(`Teams.${name}`, {
					leader: user.id,
					role: teamRole.id,
					channel: teamChannel.id,
					color: color.toString()
				})

				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setTitle('Team Created')
							.setDescription(`The team \*\*${name}\*\* with Leader ${user.username} has been created.`)
							.setColor('GREEN')
							.setAuthor({
								name: client.user.tag,
								iconURL: client.user.displayAvatarURL()
							})
					]
				})
			})
		} else if (subcommand === 'addplayer') {
			const user = options.getMember('user')
			const name = options.getString('name')
			db.get(`Teams.${name}`).then(async (team) => {
				if (!team) return interation.reply({
					embeds: [
						new MessageEmbed()
							.setTitle('No Team with that name exists')
							.setDescription(`Try using the command again with a team that exists.`)
							.setColor('RED')
					]
				})
				const teamRole = await guild.roles.fetch(team.role)
				const member = await guild.members.fetch(user.id)
				member.roles.add(teamRole)

				db.get(`Teams.${name}.members`).then(async (members) => {
					if (!members) {
						db.set(`Teams.${name}.members`, [user.id])
					} else {
						members.push(user.id)
						db.set(`Teams.${name}.members`, members)
					}

					await interaction.reply({
						embeds: [
							new MessageEmbed()
								.setTitle('Done')
								.setDescription(`Successfuly added ${user.name} to the team \*\*${name}\*\*`)
								.setColor('GREEN')
						]
					})
				})
			})
		}
	}
}