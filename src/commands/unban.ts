// src/commands/unban.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  TextChannel,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

export const unbanCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbane um usuário do servidor")
    // Passamos o ID (string) em vez de UserOption
    .addStringOption(
      (opt) =>
        opt
          .setName("usuario")
          .setDescription("ID ou menção do usuário banido")
          .setRequired(true)
          .setAutocomplete(true) // habilita autocomplete
    )
    .addStringOption((opt) =>
      opt
        .setName("motivo")
        .setDescription("Motivo para o desbanimento")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  // Handler para autocomplete
  async autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) return;
    const focused = interaction.options.getFocused();
    const bans = await interaction.guild.bans.fetch();
    const choices = bans.map((b) => ({
      name: b.user.tag,
      value: b.user.id,
    }));
    // filtra pelos caracteres já digitados
    const filtered = choices
      .filter(
        (c) =>
          c.name.toLowerCase().includes(focused.toString().toLowerCase()) ||
          c.value.startsWith(focused.toString())
      )
      .slice(0, 25);
    await interaction.respond(filtered);
  },

  // Handler de execução
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // captura o ID puro ou menção e extrai somente números
    const raw = interaction.options.getString("usuario", true);
    const userId = raw.replace(/\D/g, "");

    const motivo = interaction.options.getString("motivo", true);

    // busca a lista de bans
    const bans = await interaction.guild.bans.fetch();
    const banInfo = bans.get(userId);
    if (!banInfo) {
      return interaction.reply({
        content: "❌ Este usuário não está banido.",
        ephemeral: true,
      });
    }

    // realiza o unban
    await interaction.guild.members.unban(
      userId,
      `$Foi desbanido por: ${interaction.user.tag} | Motivo: ${motivo}`
    );

    // envia o embed de log
    const logChannel = interaction.guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .get(process.env.LOG_CHANNEL_ID!);

    if (logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor("#8162FF")
        .setTitle("🔓 Registro de Desbanimento")
        .addFields(
          {
            name: "Usuário Desbanido",
            value: `${banInfo.user.tag}`,
            inline: true,
          },
          {
            name: "Desbanido por",
            value: `${interaction.user.tag}`,
            inline: true,
          },
          { name: "Motivo", value: motivo, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: `✅ **${banInfo.user.tag}** foi desbanido com sucesso!`,
      ephemeral: true,
    });
  },
};
