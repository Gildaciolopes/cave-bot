// src/index.ts
import { Client, IntentsBitField, Interaction } from "discord.js";
import * as dotenv from "dotenv";
import { banCommand } from "./commands/ban";

dotenv.config();

console.log(`Token recebido: ${process.env.TOKEN}`);

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildBans],
});

client.once("ready", () => {
  console.log(`🤖 Bot iniciado como ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === banCommand.data.name) {
    await banCommand.execute(interaction);
  }
  // ... outros comandos
});

client.login(process.env.TOKEN);
