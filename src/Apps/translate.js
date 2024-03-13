const Concord = require("../../assets/classes/base.js")
const Discord = require("discord.js")
const file = require("../../assets/json/language.json")
module.exports = {
  name: "Translate Message",
  type: 3,
  /* param
  * @param {interaction} ContextMenuInteraction
  */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })
    const ggTranslateIcon = "https://ssl.gstatic.com/translate/favicon.ico"
    const fetch = require("node-fetch")
    const message = interaction.options.getMessage("message")
    const contentToTranslate = encodeURIComponent(message.content)
    const result = []

    if(message.content.length == 0) return await interaction.editReply("Message must have some sort of text to translate!")
    const response = await fetch(`https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&dj=1&source=input&q=`+ contentToTranslate)
    try {
    const body = await response.json();
    const accuracy = (body.confidence * 100).toFixed(0)
    for (const value of body.sentences) {
      result.push(value.trans)
    }
    const file = require("../../assets/json/language.json")
    const fromLang = file.text.find(entry => entry.code == body.src).language

    const embed = new Discord.MessageEmbed()
    .setFooter({text:`Accuracy: ${accuracy}%. Powered by Google Translate`, iconURL: ggTranslateIcon})
    .setTitle(`Translated from ${fromLang} to English`)
    .addFields({
      name: `Original Text (${fromLang}):`,
      value: `\`\`\`${message.content}\`\`\``
    }, {
      name: `Translated Text (English):`,
      value: `\`\`\`${result.join("")}\`\`\``
    })
    await interaction.editReply({embeds: [embed]})
    } catch(err) {
      console.log(err)
      interaction.editReply("Failed to translate.")
    }
  },
};