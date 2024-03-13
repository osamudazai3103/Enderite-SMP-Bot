const Discord = require("discord.js")
const EnderChamp = require("../../assets/classes/base")
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand() && !interaction.isContextMenu()) return;
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        if (command.elevatedPermissions) {
            if (!["1090911265095954442"].includes(interaction.user.id)) return await interaction.reply({
                content: "Insufficient Permissions.",
                ephemeral: true
            });
        }
        if (command.userPermissions || command.clientPermissions) {
            const permissionCheck = []
            if (command.userPermissions) {
                var mUP = []
                const missingUserPerms = new Discord.Permissions(interaction.memberPermissions).missing(command.userPermissions)
                if (missingUserPerms.length > 0 && interaction.user.id !== "1090911265095954442") {
                    missingUserPerms.forEach(entry => {
                        entry = entry.replaceAll("_", " ").replaceAll("GUILD", "SERVER").toLowerCase()
                        mUP.push(new EnderChamp.Util().capitalize(entry))
                    })
                    return await interaction.reply({
                        content: `Uh oh, running this command requires you to have \`${mUP.join("\`, \`")}\` permission(s)!`,
                        ephemeral: true
                    })
                }
            }
            if (command.clientPermissions) {
                var mCP = []
                const missingClientPerms = new Discord.Permissions(interaction.guild.me.permissions).missing(command.clientPermissions)
                if (missingClientPerms.length > 0) {
                    missingClientPerms.forEach(entry => {
                        entry = entry.replaceAll("_", " ").replaceAll("GUILD", "SERVER").toLowerCase()
                        mCP.push(new EnderChamp.Util().capitalize(entry))
                    })
                    return await interaction.reply({
                        content: `Required Bot Permission(s):\n\`${mCP.join("\`, \`")}\`\n\nNo change has been made to your server settings.\nPlease give me all listed permission(s) to proceed.`,
                        ephemeral: true
                    })
                }
            }
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
};