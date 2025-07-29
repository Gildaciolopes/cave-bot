// src/commands/mute.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

export const muteCommand = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription(
      "Silencia um usuário por um período determinado (em horas)."
    )
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Escolha quem deve ser mutado")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("duracao")
        .setDescription("Duração em horas (pode usar decimais, ex: 0.5, 1, 2)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo do mute").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // obtém o usuario e busca o GuildMember garantindo métodos corretos
    const user = interaction.options.getUser("usuario", true);
    const motivo = interaction.options.getString("motivo", true);
    const horas = interaction.options.getNumber("duracao", true);

    // valida duração
    if (horas <= 0) {
      return interaction.reply({
        content: "❌ A duração deve ser maior que 0 horas.",
        ephemeral: true,
      });
    }
    const duracaoMS = horas * 3600000;
    if (duracaoMS < 1000 || duracaoMS > 28 * 24 * 3600000) {
      return interaction.reply({
        content:
          "❌ Duração inválida. Use entre 0.00028 e 672 horas (até 28 dias).",
        ephemeral: true,
      });
    }

    // busca o membro completo
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    if (!member) {
      return interaction.reply({
        content: "❌ Membro não encontrado.",
        ephemeral: true,
      });
    }
    if (!member.moderatable) {
      return interaction.reply({
        content: "❌ Não posso mutar este usuário.",
        ephemeral: true,
      });
    }

    // aplica o timeout
    await member.timeout(
      duracaoMS,
      `Mutado por: ${interaction.user.tag} | Motivo: ${motivo} | ${horas} hora(s)`
    );

    // envia embed de log
    const logChannel = interaction.guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .get(process.env.LOG_CHANNEL_ID!);

    if (logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor("#8162FF")
        .setTitle("🔇 Registro de Mute")
        .addFields(
          { name: "Usuário Mutado", value: `${user}`, inline: true },
          {
            name: "Mutado por",
            value: `${interaction.user}`,
            inline: true,
          },
          { name: "Duração", value: `${horas} hora(s)`, inline: true },
          { name: "Motivo", value: motivo, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    // confirmação
    return interaction.reply({
      content: `✅ **${user.tag}** foi mutado por ${horas} hora(s).`,
      ephemeral: true,
    });
  },
};
