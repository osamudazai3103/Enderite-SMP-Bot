const { MessageEmbed } = require("discord.js");
const simplydjs = require("simply-djs")

module.exports = {
  name: "embedcreate",
  description: "Create awesome embeds using this command.",
  
  async execute(interaction) {
    await interaction.deferReply()
    simplydjs.embedCreate(interaction, {
      slash: true,
      credit: false
    })
  },
}; 