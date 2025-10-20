
const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('scam')
    .setDescription('Signaler un scam pour un utilisateur.')
    .addUserOption(o => o.setName('user').setDescription('Utilisateur suspect').setRequired(true))
    .addStringOption(o => o.setName('commentaires').setDescription('Description du scam').setRequired(true)),
};
