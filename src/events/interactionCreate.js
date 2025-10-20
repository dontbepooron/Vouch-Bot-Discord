
module.exports = (client) => {
  const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
  const path = require('path');
  const { readJson, safeWriteJson, appendLog, isBlacklisted } = require('../utils/storage');
  const { config } = require('../utils/config');
  const { allow } = require('../utils/rate');

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    // rate limit global per user
    const rl = config.rateLimit || { count:3, windowSec:60 };
    if (!allow(interaction.user.id, rl.count, rl.windowSec)) {
      const e = new EmbedBuilder()
        .setTitle('Limiter atteint')
        .setDescription('Tu envoies trop de commandes, réessaie dans quelques instants.')
        .setColor(config.embed.color.warning)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    if (commandName === 'vouches') {
      const target = interaction.options.getUser('user', true);
      const comment = interaction.options.getString('commentaires') || '';
      if (await isBlacklisted(interaction.user.id)) {
        const e = new EmbedBuilder()
          .setTitle('Action refusée')
          .setDescription('Vous êtes blacklisté, vous ne pouvez pas ajouter de vouches.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return interaction.reply({ embeds: [e], ephemeral: true });
      }
      const vouches = await readJson('vouches.json');
      const item = {
        authorId: interaction.user.id,
        targetId: target.id,
        comment,
        timestamp: new Date().toISOString()
      };
      vouches.push(item);
      await safeWriteJson('vouches.json', vouches);

      const embed = new EmbedBuilder()
        .setTitle('✅ Nouvelle vouch')
        .setDescription(`${interaction.user} a laissé une vouch pour ${target}`)
        .addFields(
          { name: 'Vouch par', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Pour', value: `<@${target.id}>`, inline: true },
          { name: 'Commentaire', value: comment || '—', inline: false }
        )
        .setThumbnail(target.displayAvatarURL())
        .setImage(config.embed.bannerUrl)
        .setColor(config.embed.color.vouch)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });

      await interaction.reply({ embeds: [embed] });
      appendLog(`VOUCH: ${interaction.user.id} -> ${target.id}`);
      return;
    }

    if (commandName === 'scam') {
      const target = interaction.options.getUser('user', true);
      const comment = interaction.options.getString('commentaires', true);
      if (await isBlacklisted(interaction.user.id)) {
        const e = new EmbedBuilder()
          .setTitle('Action refusée')
          .setDescription('Vous êtes blacklisté, vous ne pouvez pas signaler un scam.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return interaction.reply({ embeds: [e], ephemeral: true });
      }
      const scams = await readJson('scams.json');
      const item = {
        authorId: interaction.user.id,
        targetId: target.id,
        comment,
        timestamp: new Date().toISOString()
      };
      scams.push(item);
      await safeWriteJson('scams.json', scams);

      const embed = new EmbedBuilder()
        .setTitle('🚨 Report de SCAM')
        .setDescription(`Un report de scam a été soumis concernant ${target}`)
        .addFields(
          { name: 'Report par', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Cible', value: `<@${target.id}>`, inline: true },
          { name: 'Commentaire', value: comment, inline: false }
        )
        .setThumbnail(target.displayAvatarURL())
        .setImage(config.embed.bannerUrl)
        .setColor(config.embed.color.scam)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });

      await interaction.reply({ embeds: [embed] });
      appendLog(`SCAM: ${interaction.user.id} -> ${target.id}`);
      return;
    }
  });
};
