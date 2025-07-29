import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import ms from "ms";

export const banCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Bane um usuário por um determinado tempo ou permanentemente."
    )
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Escolha quem deve ser banido")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("tempo")
        .setDescription(
          "Tempo de banimento. Use h para horas, d para dias ou perma para permanente."
        )
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("razao")
        .setDescription("Descreva a razão do banimento.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const targetUser = interaction.options.getUser("usuario", true);
    const tempoRaw = interaction.options.getString("tempo", true).toLowerCase();
    const razao = interaction.options.getString("razao", true);

    // busca o usuário
    const member = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (!member) {
      return interaction.reply({
        content: "❌ Membro não encontrado neste servidor.",
        ephemeral: true,
      });
    }

    if (!member.bannable) {
      return interaction.reply({
        content: "❌ Não tenho permissão para banir este usuário.",
        ephemeral: true,
      });
    }

    // interpreta a duração (ms retorna number ou undefined)
    let duracaoMS: number | undefined;
    let duracaoLabel = "Permanente";
    if (tempoRaw !== "perma") {
      const parsed = ms(tempoRaw as ms.StringValue);
      if (typeof parsed !== "number" || isNaN(parsed)) {
        return interaction.reply({
          content:
            "❌ Tempo inválido. Use, por exemplo, `1h`, `2d` ou `perma`.",
          ephemeral: true,
        });
      }
      duracaoMS = parsed;
      duracaoLabel = tempoRaw;
    }

    // aplica o ban
    await member.ban({
      deleteMessageSeconds: 60 * 60 * 24, // apaga 1 dia de mensagens (86400 segundos)
      reason: `${interaction.user.tag}: ${razao} | ${duracaoLabel}`, // sempre string
    });

    // envia embed de log
    const logChannel = interaction.guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .get(process.env.LOG_CHANNEL_ID!);

    if (logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor("#8162FF")
        .setTitle("📋 Registro de /ban")
        .addFields(
          { name: "Usuário Banido", value: `${targetUser}`, inline: true },
          { name: "Banido por", value: `${interaction.user}`, inline: true },
          { name: "Duração", value: duracaoLabel, inline: true },
          { name: "Motivo", value: razao, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    // agendamento de desban (se temporário)
    if (duracaoMS) {
      const timeout = setTimeout(async () => {
        const bans = await interaction.guild!.bans.fetch();
        if (bans.has(targetUser.id)) {
          await interaction.guild!.members.unban(
            targetUser.id,
            "Tempo de banimento expirado"
          );
        }
      }, duracaoMS);
      if (typeof timeout === "object" && "unref" in timeout) timeout.unref();
    }

    // resposta ao admin
    return interaction.reply({
      content: `✅ **${targetUser.tag}** banido com sucesso! (Duração: ${duracaoLabel})`,
      ephemeral: true,
    });
  },
};
