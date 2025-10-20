
module.exports = (client) => {
  const { EmbedBuilder } = require('discord.js');
  const { isBuyer, isAdmin, addAdmin, removeAdmin, addBl, removeBl, readJson, appendLog } = require('../utils/storage');
  const { prefix, config } = require('../utils/config');

  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // helper to resolve target: mention, id, or replied user
    const resolveTarget = () => {
      if (message.reference && message.reference.messageId) {
        const ref = message;
        // we try to get the replied user via fetch - best effort
        return message.fetchReply ? null : null;
      }
      const mention = message.mentions.users.first();
      if (mention) return mention;
      if (args[0] && /^\d{17,19}$/.test(args[0])) {
        try {
          return { id: args[0], username: 'User' };
        } catch { return null; }
      }
      return null;
    };

    // .admin (buyer only)
    if (cmd === 'admin') {
      if (!await isBuyer(message.author.id)) {
        const e = new EmbedBuilder()
          .setTitle('Permission refusée')
          .setDescription('Seul le buyer peut exécuter cette commande.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return message.reply({ embeds: [e] });
      }
      const target = message.mentions.users.first() || (args[0] && { id: args[0] }) || null;
      if (!target || !target.id) {
        const e = new EmbedBuilder().setTitle('Usage').setDescription('`.admin @user`').setColor(config.embed.color.admin);
        return message.reply({ embeds: [e] });
      }
      const added = await addAdmin(target.id);
      const e = new EmbedBuilder()
        .setTitle(added ? 'Administrateur ajouté' : 'Administrateur existant')
        .setDescription(added ? `L'utilisateur <@${target.id}> est maintenant admin.` : `<@${target.id}> était déjà admin.`)
        .setColor(config.embed.color.admin)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });
      await message.reply({ embeds: [e] });
      appendLog(`ADMIN ADD by ${message.author.id} -> ${target.id}`);
      return;
    }

    if (cmd === 'deladmin') {
      if (!await isBuyer(message.author.id)) {
        const e = new EmbedBuilder()
          .setTitle('Permission refusée')
          .setDescription('Seul le buyer peut exécuter cette commande.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return message.reply({ embeds: [e] });
      }
      const target = message.mentions.users.first() || (args[0] && { id: args[0] }) || null;
      if (!target || !target.id) {
        const e = new EmbedBuilder().setTitle('Usage').setDescription('`.deladmin @user`').setColor(config.embed.color.admin);
        return message.reply({ embeds: [e] });
      }
      const removed = await removeAdmin(target.id);
      const e = new EmbedBuilder()
        .setTitle(removed ? 'Administrateur retiré' : 'Administrateur inconnu')
        .setDescription(removed ? `L'utilisateur <@${target.id}> n'est plus admin.` : `<@${target.id}> n'était pas admin.`)
        .setColor(config.embed.color.admin)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });
      await message.reply({ embeds: [e] });
      appendLog(`ADMIN REMOVE by ${message.author.id} -> ${target.id}`);
      return;
    }

    if (cmd === 'adminlist') {
      if (!await isBuyer(message.author.id)) {
        const e = new EmbedBuilder()
          .setTitle('Permission refusée')
          .setDescription('Seul le buyer peut exécuter cette commande.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return message.reply({ embeds: [e] });
      }
      const admins = await readJson('admins.json');
      const description = admins.length ? admins.map(x => `<@${x}> \`(${x})\``).join('\n') : 'Aucun admin défini.';
      const e = new EmbedBuilder()
        .setTitle('Liste des admins')
        .setDescription(description)
        .addFields({ name: 'Total', value: String(admins.length), inline: true })
        .setColor(config.embed.color.admin)
        .setTimestamp()
        .setFooter({ text: config.botName || 'VouchScamBot' });
      return message.reply({ embeds: [e] });
    }

    // Admin commands (.bl, .unbl, .bllist)
    if (cmd === 'bl' || cmd === 'unbl' || cmd === 'bllist') {
      const callerId = message.author.id;
      if (!await isAdmin(callerId) && !await isBuyer(callerId)) {
        const e = new EmbedBuilder()
          .setTitle('Permission refusée')
          .setDescription('Commande réservée aux admins.')
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return message.reply({ embeds: [e] });
      }

      if (cmd === 'bllist') {
        const bl = await readJson('blacklist.json');
        const desc = bl.length ? bl.map(x => `<@${x}> \`(${x})\``).join('\n') : 'Aucun utilisateur blacklisté.';
        const e = new EmbedBuilder()
          .setTitle('Blacklist')
          .setDescription(desc)
          .addFields({ name: 'Total', value: String(bl.length), inline: true })
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        return message.reply({ embeds: [e] });
      }

      const target = message.mentions.users.first() || (args[0] && { id: args[0] }) || null;
      if (!target || !target.id) {
        const e = new EmbedBuilder().setTitle('Usage').setDescription(`\`${prefix}bl @user\` ou \`${prefix}unbl @user\``).setColor(config.embed.color.warning);
        return message.reply({ embeds: [e] });
      }

      // protection: cannot bl buyer unless caller is buyer
      if (String(target.id) === String((await require('../utils/storage').isBuyer(target.id) ? target.id : 'NOPE'))) {
        // noop - degrade gracefully
      }

      if (cmd === 'bl') {
        // cannot let admins blacklist other admins unless caller is buyer
        const targetIsAdmin = await require('../utils/storage').isAdmin(target.id);
        const callerIsBuyer = await isBuyer(callerId);
        if (targetIsAdmin && !callerIsBuyer) {
          const e = new EmbedBuilder().setTitle('Action interdite').setDescription('Vous ne pouvez pas blacklister un autre admin.').setColor(config.embed.color.warning);
          return message.reply({ embeds: [e] });
        }
        // prevent blacklisting buyer
        if (await isBuyer(target.id)) {
          const e = new EmbedBuilder().setTitle('Interdit').setDescription('Vous ne pouvez pas blacklister le buyer.').setColor(config.embed.color.warning);
          return message.reply({ embeds: [e] });
        }
        const added = await addBl(target.id);
        // If caller is buyer and target was admin, remove admin
        if (callerIsBuyer && targetIsAdmin) {
          await removeAdmin(target.id);
        }
        const e = new EmbedBuilder()
          .setTitle(added ? 'Utilisateur blacklisté' : 'Utilisateur déjà blacklisté')
          .setDescription(added ? `<@${target.id}> a été ajouté à la blacklist.` : `<@${target.id}> est déjà dans la blacklist.`)
          .setColor(config.embed.color.warning)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        await message.reply({ embeds: [e] });
        appendLog(`BL by ${callerId} -> ${target.id}`);
        return;
      }

      if (cmd === 'unbl') {
        const removed = await removeBl(target.id);
        const e = new EmbedBuilder()
          .setTitle(removed ? 'Utilisateur retiré de la blacklist' : 'Utilisateur non blacklisté')
          .setDescription(removed ? `<@${target.id}> a été retiré.` : `<@${target.id}> n'était pas blacklisté.`)
          .setColor(config.embed.color.admin)
          .setTimestamp()
          .setFooter({ text: config.botName || 'VouchScamBot' });
        await message.reply({ embeds: [e] });
        appendLog(`UNBL by ${callerId} -> ${target.id}`);
        return;
      }
    }
  });
};
