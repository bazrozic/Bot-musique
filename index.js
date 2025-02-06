const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("Pong ! 🏓");
  }
});

client.on("messageCreate", (message) => {
  if (message.content === "!stop") {
    const channel = message.member.voice.channel;
    if (channel) {
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        connection.destroy();
        message.reply("# OK JE FERME MA GUEULE !");
      } else {
        message.reply("Je ne suis pas connecté à un salon vocal.");
      }
    } else {
      message.reply("Tu dois être dans un salon vocal pour utiliser cette commande.");
    }
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!play ")) return;
  const url = message.content.split(" ")[1];
  if (!ytdl.validateURL(url)) return message.reply("Lien invalide.");

  const channel = message.member.voice.channel;
  if (!channel) return message.reply("Rejoins un salon vocal !");

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });

  try {
    const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    player.on("error", (error) => {
      console.error("Audio Player Error:", error.message);
      message.reply("Une erreur est survenue lors de la lecture de la vidéo.");
    });

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    connection.subscribe(player);
    player.play(resource);
  } catch (error) {
    console.error("Stream Error:", error.message);
    message.reply("Une erreur est survenue lors de la lecture de la vidéo.");
  }
});

client.login(
  "MTMzNzE0ODM2Njc2ODgzNjYwOQ.Gu2aLJ.TdMwWWDFw6TTwH5HaFikYP0mPKVcfst8YuuNo0"
);
