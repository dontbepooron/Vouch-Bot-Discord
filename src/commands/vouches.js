
const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouches')
    .setDescription('Laisser une vouch publique pour un utilisateur.')
    .addUserOption(o => o.setName('user').setDescription('Utilisateur cible').setRequired(true))
    .addStringOption(o => o.setName('commentaires').setDescription('Commentaire (optionnel)').setRequired(false)),
};
