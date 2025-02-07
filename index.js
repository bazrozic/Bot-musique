const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const player = createAudioPlayer();
const queue = [];

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
      message.reply(
        "Tu dois être dans un salon vocal pour utiliser cette commande."
      );
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.content === "!pause") {
    if (player.state.status === AudioPlayerStatus.Playing) {
      player.pause();
      message.reply("Lecture mise en pause.");
    } else {
      message.reply("Aucune lecture en cours.");
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.content === "!resume") {
    if (player.state.status === AudioPlayerStatus.Paused) {
      player.unpause();
      message.reply("Lecture reprise.");
    } else {
      message.reply("Aucune lecture en pause.");
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.content === "!skip") {
    if (
      player.state.status === AudioPlayerStatus.Playing ||
      player.state.status === AudioPlayerStatus.Paused
    ) {
      player.stop();
      message.reply("Passage à la chanson suivante.");
    } else {
      message.reply("Aucune lecture en cours.");
    }
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!play ")) return;
  const url = message.content.split(" ")[1];
  if (!ytdl.validateURL(url)) return message.reply("Lien invalide.");

  const channel = message.member.voice.channel;
  if (!channel) return message.reply("Rejoins un salon vocal !");

  queue.push(url);
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title;
  const duration = info.videoDetails.lengthSeconds;
  const durationFormatted = new Date(duration * 1000)
    .toISOString()
    .substr(11, 8);

  message.channel.send(`🎵 Ajout de : **${title}** (${durationFormatted}) a la file d'attente🎵`);
  console.log(queue);

  if (player.state.status !== AudioPlayerStatus.Idle) return;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });

  player.on("error", (error) => {
    console.error("Audio Player Error:", error.message);
    message.reply("Une erreur est survenue lors de la lecture de la vidéo.");
  });

  player.on(AudioPlayerStatus.Idle, () => {
    if (queue.length > 0) {
      playNextSong(connection, message);
    } else {
      connection.destroy();
    }
  });

  playNextSong(connection, message);
});

async function playNextSong(connection, message) {
  if (queue.length === 0) return;

  const url = queue.shift();
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const duration = info.videoDetails.lengthSeconds;
    const durationFormatted = new Date(duration * 1000)
      .toISOString()
      .substr(11, 8);

    message.channel.send(`🎵 Lecture de: **${title}** (${durationFormatted})`);

    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });
    const resource = createAudioResource(stream);
    connection.subscribe(player);
    player.play(resource);
  } catch (error) {
    console.error("Stream Error:", error.message);
    message.reply("Une erreur est survenue lors de la lecture de la vidéo.");
  }
}

client.login(
  process.env.BOT_TOKEN
);
