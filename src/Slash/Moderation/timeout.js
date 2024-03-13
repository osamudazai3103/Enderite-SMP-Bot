const ms = require('ms')
const pms = require('pretty-ms')
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton
} = require('discord.js')

module.exports = {
    name: 'timeout',
    description: 'Timeout a member and prevent them from speaking, reacting and joining voice channels.',
    category: 'Moderation',
    clientPermissions: ["MODERATE_MEMBERS"],
    userPermissions: ["MODERATE_MEMBERS"],
    options: [
        {
            name: "add",
            description: "Time out someone, overwrite timeout or remove their timeout.",
            type: 1,
            options: [{
                name: 'user',
                description: 'User to timeout',
                type: 6,
                required: true
            },
            {
                name: 'time',
                description: 'amount of time to timeout eg:1 minute',
                type: 3,
                required: true,
            },
            {
                name: 'reason',
                description: 'reason for the timeout',
                type: 3,
                required: false
            }]
        },
        {
            name: "remove",
            description: "Remove someone's timeout.",
            type: 1,
            options: [{
                name: 'user',
                description: 'User to timeout',
                type: 6,
                required: true
            },
            {
                name: 'reason',
                description: 'reason for the timeout',
                type: 3,
                required: false
            }]
        }
    ],

    async execute(interaction) {
        await interaction.deferReply()
        const {
            client,
            options,
            member,
            guild
        } = interaction
        const user = options.getUser('user')
        const time = options.getString('time')
        const subcommand = options.getSubcommand()

        const reason = "By: " + member.user.tag + " For: " + options.getString('reason') || "Timed out by " + member.user.tag;
        const totimeout = await guild.members.fetch(user.id).catch(e => {
            return interaction.editReply('There was an error fetching the user!');
        })
        if (!totimeout.manageable) return interaction.editReply('I can\'t timeout that user!');
        if (totimeout.roles.highest.position >= member.roles.highest.position && guild.ownerId !== member.id) return interaction.editReply("Sorry you can't timeout members in a role higher than you!");

        if (subcommand === "add") {
         let timeInMs = 0
         let ok = true;
         if (time !== "0") {
        time.replace(/\s\s+/g, ' ').split(" ").forEach(async Tim => {
          const timeMs = ms(Tim)
          if (!timeMs) return ok = false;
          timeInMs += timeMs
        })
        }

        if (!ok) return interaction.editReply("Invalid Time! Use s, m, h for seconds, minutes, hours respectively.\nExample: 5m (5 minutes), 12d 5h 24m 56s (12 days 5 hours 24 minutes 56 seconds).")

            if (timeInMs <= 9999) return interaction.editReply("You cannot create a timeout with a duration less than 10 seconds.");
            if (timeInMs > 2332800000) return interaction.editReply("You cannot create a timeout lasting longer than 27 days.");

            if (totimeout.communicationDisabledUntil > Date.now()) {
                const remove = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('add_timeout')
                            .setLabel('Overwrite Timeout')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('remove_timeout')
                            .setLabel('Remove Timeout')
                            .setStyle('DANGER'),
                    );

                let tembed = new MessageEmbed()
                    .setTitle("Member already timed out!")
                    .setAuthor(member.user.tag, member.displayAvatarURL())
                    .setDescription(`**${totimeout.user.tag}** is already timed out.\n**Until:** <t:${Math.round(totimeout.communicationDisabledUntilTimestamp / 1000)}:f>.`)
                    .setFooter(guild.name, guild.iconURL())
                    .setColor("ORANGE")
                    .setTimestamp()

                const m = await interaction.editReply({
                    embeds: [tembed],
                    components: [remove]
                })
                const collect = await m.createMessageComponentCollector({
                    componentType: "BUTTON",
                    max: 1,
                    time: 10000,
                });

                collect.on("collect", async b => {
                    await b.deferUpdate();
                    if (b.user.id !== member.id) return b.followUp({
                        content: "This is not for you!",
                        ephemeral: true
                    });

                    if (b.customId === "remove_timeout") {
                        await totimeout?.timeout(0, "Timeout Removed by " + member.user.tag).catch(e => {
                            return b.followUp({
                                content: "Error: " + e,
                                ephemeral: true
                            });
                        })
                        b.followUp({
                            content: "Succesfully removed Timeout for **" + totimeout.user.tag + "**.",
                        })
                    } else {
                        await totimeout.timeout(timeInMs, reason).catch(e => {
                            return b.followUp({
                                content: "Error: " + e,
                                ephemeral: true
                            })
                        })
                        let embed = new MessageEmbed()
                            .setTitle("Timeout Added")
                            .setAuthor(member.user.tag, member.displayAvatarURL())
                            .setDescription(`**${member.user.tag}** (ID: ${member.id}) timed out **${totimeout.user.tag}** (ID: ${totimeout.id}) for ${pms(timeInMs, { verbose: true })}\nTheir timeout will be removed <t:${Math.round(totimeout.communicationDisabledUntilTimestamp / 1000)}:R>`)
                            .setFooter(guild.name, guild.iconURL())
                            .setColor("RED")
                            .setTimestamp()
                        interaction.channel.send({ embeds: [embed] })
                    }
                })

                collect.on("end", async (b, reason) => {
                    let dbutton = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('add_timeout')
                                .setLabel('Overwrite Timeout')
                                .setDisabled(true)
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setCustomId('remove_timeout')
                                .setLabel('Remove Timeout')
                                .setDisabled(true)
                                .setStyle('DANGER'),
                        )

                    await interaction.editReply({
                        embeds: [tembed],
                        components: [dbutton]
                    })
                })
            } else {
                await totimeout.timeout(timeInMs, reason).catch(e => {
                    return interaction.editReply({
                        content: "Error: " + e,
                        ephemeral: true
                    })
                })
                let embed = new MessageEmbed()
                    .setTitle("Timeout Added")
                    .setAuthor(member.user.tag, member.displayAvatarURL())
                    .setDescription(`**${member.user.tag}** (ID: ${member.id}) timed out **${totimeout.user.tag}** (ID: ${totimeout.id}) for ${pms(timeInMs, { verbose: true })}.\nTheir timeout will be removed <t:${Math.round(totimeout.communicationDisabledUntilTimestamp / 1000)}:R>.`)
                    .setFooter(guild.name, guild.iconURL())
                    .setColor("RED")
                    .setTimestamp()
                interaction.editReply({
                    embeds: [embed]
                })
            }
        } else if (subcommand === "remove") {
            if (totimeout.communicationDisabledUntil <= Date.now()) return interaction.editReply("That user is not timed out!")
            await totimeout.timeout(0, reason || `Timeout removed by ${member.user.tag}`).catch(e => {
                return interaction.editReply({
                    content: "Error: " + e,
                    ephemeral: true
                })
            })
            let embed = new MessageEmbed()
                .setTitle("Timeout Removed")
                .setAuthor(member.user.tag, member.displayAvatarURL())
                .setDescription(`**${member.user.tag}** (ID: ${member.id}) removed the timeout for **${totimeout.user.tag}** (ID: ${totimeout.id}).`)
                .setFooter(guild.name, guild.iconURL())
                .setColor("GREEN")
                .setTimestamp()
            interaction.editReply({
                embeds: [embed]
            })
        }
    }
}