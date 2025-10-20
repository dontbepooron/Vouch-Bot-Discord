
/**
 * deploy-commands.js
 * Enregistre les commandes slash dans une GUILD (mode dev).
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId || !guildId) {
  console.error('Assurez-vous que TOKEN, CLIENT_ID et GUILD_ID sont définis dans .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) commands.push(cmd.data);
}

const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    console.log('Déploiement des commandes (guild)...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('Déployé.');
  } catch (err) {
    console.error(err);
  }
})();
