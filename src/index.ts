import { Client, IntentsBitField, Interaction } from "discord.js";
import * as dotenv from "dotenv";
import { banCommand } from "./commands/ban";
import { unbanCommand } from "./commands/unban";
import { muteCommand } from "./commands/mute";

dotenv.config();

console.log(`Token recebido: ${process.env.TOKEN}`);

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildBans],
});

client.once("ready", () => {
  console.log(`🤖 Bot iniciado como ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isAutocomplete() && interaction.commandName === "unban") {
    return unbanCommand.autocomplete(interaction);
  }
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ban") {
    await banCommand.execute(interaction);
  } else if (interaction.commandName === "unban") {
    await unbanCommand.execute(interaction);
  } else if (interaction.commandName === muteCommand.data.name) {
    await muteCommand.execute(interaction);
  }
  // ... outros comandos
});

client.login(process.env.TOKEN);
