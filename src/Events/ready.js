const path = require('path')
const { REST } = require('@discordjs/rest');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { Routes } = require('discord-api-types/v9');
const { glob } = require("glob");
const { promisify } = require("util"); 
const globPromise = promisify(glob);
const token = process.env["token"]
const clientId = "930346607197683713"
const guildId = "930324370902110298"
const rest = new REST({ version: '9' }).setToken(token);
const EnderChamp = require("../../assets/classes/base")

module.exports = {
  name: "ready",
  async execute(bot) {
    console.log(`Logged in as ${bot.user.tag}`)
    bot.user.setPresence({
        status: 'dnd',
        activities: [{
            name: "Enderite SMP",
            type: "WATCHING"
        }]
        })
   new EnderChamp.Bot({ client: bot }).registerCommands()
  }
}