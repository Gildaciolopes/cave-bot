import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

export const unmuteCommand = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove o mute de um usuário no servidor")
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Escolha quem deve ser desmutado")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("motivo")
        .setDescription("Motivo para remoção do mute")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser("usuario", true);
    const motivo = interaction.options.getString("motivo", true);

    // Busca GuildMember
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    if (!member) {
      return interaction.reply({
        content: "❌ Membro não encontrado.",
        ephemeral: true,
      });
    }

    // Verifica se está realmente mutado
    if (member.communicationDisabledUntilTimestamp === null) {
      return interaction.reply({
        content: "❌ Este usuário não está mutado.",
        ephemeral: true,
      });
    }

    // Remove o mute (timeout)
    await member.timeout(
      null,
      `Desmutado por: ${interaction.user.tag} | Motivo: ${motivo}`
    );

    // Envia embed de log
    const logChannel = interaction.guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .get(process.env.LOG_CHANNEL_ID!);

    if (logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor("#8162FF")
        .setTitle("🔈 Registro de Unmute")
        .addFields(
          { name: "Usuário Desmutado", value: `${user}`, inline: true },
          {
            name: "Desmutado por",
            value: `${interaction.user}`,
            inline: true,
          },
          { name: "Motivo", value: motivo, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    // Resposta ao executor
    return interaction.reply({
      content: `✅ **${user.tag}** foi desmutado com sucesso!`,
      ephemeral: true,
    });
  },
};
