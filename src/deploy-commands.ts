import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import * as dotenv from "dotenv";
import { banCommand } from "./commands/ban";
import { unbanCommand } from "./commands/unban";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Certifique-se de adicionar CLIENT_ID, GUILD_ID e TOKEN no seu .env
const TOKEN = process.env.TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

// Lista de comandos a serem registrados
const commands = [
  banCommand.data.toJSON(),
  unbanCommand.data.toJSON(),
  // Adicione aqui outros comandos, por exemplo:
  // outroCommand.data.toJSON(),
];

// Instância do REST para deploy de comandos
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🚀 Iniciando deploy de comandos...");
    await rest.put(
      // Para deploy global: Routes.applicationCommands(CLIENT_ID)
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Comandos registrados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
  }
})();
