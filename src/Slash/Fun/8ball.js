const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "8ball",
  category: "Fun",
  description: "Ask any question from the bot.",
  options: [
    {
      name: "question",
      description: "The questions to ask",
      type: 3,
      required: true,
    },
  ],
  async execute(interaction) {
    const responses = [
      "It is certain",
      "It is decidedly so",
      "Without a doubt",
      "Yes – definitely",
      "You may rely on it",
      "As I see it",
      "yes",
      "Most Likely",
      "Outlook good",
      "no",
      "Signs point to yes",
      "not at all",
      "kekw",
      "Visible confusion",
      "maybe",
      "no cuz yeah",
      "S",
      "yeeeee",
      "yup",
      "no chance",
      "not at all",
      "thats not going to happen",
      "😶",
      "nooe"
    ];
    const random = responses[Math.floor(Math.random() * responses.length)];
    const question = interaction.options.getString("question");
    let embed = new MessageEmbed()
      .setAuthor({name:interaction.member.user.tag, iconURL:interaction.member.displayAvatarURL()})
      .setTitle("8ball")
      .setColor("ORANGE")
      .setDescription("Question: " + question + "\nAnswer: " + random)
      .setFooter({text:"This is for fun purpose only."});
    interaction.reply({ embeds: [embed] });
  },
};
