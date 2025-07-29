import { Client, IntentsBitField } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

console.log("TOKEN carregado:", process.env.TOKEN);

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds, // Para checar se está online em servidores
    IntentsBitField.Flags.GuildMessages, // Para receber eventos de mensagens
    IntentsBitField.Flags.MessageContent, // Para ler conteúdo das mensagens
  ],
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error("⚠️  Token não encontrado em .env");
  process.exit(1);
}

client.once("ready", () => {
  console.log(`🤖 Bot iniciado como ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignora mensagens de outros bots
  if (message.content === "!ping") {
    await message.reply("Pong! 🏓");
  }
});

client.login(TOKEN);
