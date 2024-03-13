const express = require('express');
const app = express();
app.get("/", (req, res) => {res.send("Enderite SMP is up!")})
app.listen(3000, () => {console.log("Ready!")})

const Discord = require('discord.js')
const Flowlist = require("./assets/classes/base")

const bot = new Discord.Client({
    intents: 32767,
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER"]
})
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

new Flowlist.Bot({ client: bot }).init()