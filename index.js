require("dotenv").config();

const { App } = require("@slack/bolt")

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

app.command("/playgame-ping", async ({ command, ack, respond }) => {
    console.log(command)
    const start = Date.now()
    await ack();
    const latency = Date.now() - start;
    await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/playgame-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: `Available Commands:
    /playgame-ping - Check bot latency
    /playgame-catfact - Get a cat fact`,
  });
});


(async () => {
    await app.start();
    console.log("PlayGame is running!");
})();