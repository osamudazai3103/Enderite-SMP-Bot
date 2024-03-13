const Discord = require("discord.js")
const token = process.env[`token`]
const { glob } = require("glob");
const { promisify } = require("util");
const globPromise = promisify(glob);
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = "1214624931107831848"
const guildId = "1215358862929166346"
const rest = new REST({ version: '9' }).setToken(token);

const Bot = class Bot {
  constructor(options = {}) {
    this.client = options.client ?? null
    this.interaction = options.interaction ?? null
  }
  async init(client = this.client) {
    if (!client) throw new Error("A vaild client must be provided.")
     const commandFiles = await globPromise(`${process.cwd()}/src/+(Slash|Apps)/**/*.{js,mjs}`);
      client.commands = new Discord.Collection()
      commandFiles.map((value) => {
        const file = require(value);
        client.commands.set(file.name, file)
    });
     const eventFiles = await globPromise(`${process.cwd()}/src/Events/*.{js,mjs}`);
    eventFiles.forEach(value => {
      const event = require(value)
       if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    })
    client.login(token);
  }
  async registerCommands() {
  const commands = [];
  const slashies = await globPromise(`${process.cwd()}/src/+(Slash|Apps)/**/*.{js,mjs}`);
    slashies.map(async path => {
      const command = require(path)
      if (!command.name) throw new Error("Must specify command name")
        commands.push({
          name: command.name,
          description: command.description,
          type: command.type ?? 1,
          options: command.options ?? null
        })
    })
     rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    }).then(() => console.log('Successfully registered application commands.')).catch(console.error);
  }
}
module.exports = Bot