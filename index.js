
/**
 * index.js - point d'entrée
 * Node >=18, discord.js v14+
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isBuyer, isAdmin, isBlacklisted, safeWriteJson, readJson, appendLog } = require('./src/utils/storage');
const { prefix, config } = require('./src/utils/config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  appendLog(`Started as ${client.user.tag}`);
});

// Load event handlers (messageCreate & interactionCreate)
require('./src/events/interactionCreate')(client);
require('./src/events/messageCreate')(client);

const token = process.env.TOKEN;
if (!token) {
  console.error('TOKEN manquant dans .env');
  process.exit(1);
}
client.login(token);
