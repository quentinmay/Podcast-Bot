

This is a podcast bot backend intended to be used a utility for the [Podcast Controller UI](https://github.com/quentinmay/Podcast-Controller-UI.git).

## ⚠Requirements
1. [Discord Bot Token](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
3. [Node.js 14.0.0 or newer](https://nodejs.org/)

## ⚡Installation

Build using nexe for podcast UI. After this is complete, copy the exe, config.json, and gameState.json to the client exe directory:

```bash
git clone https://github.com/quentinmay/Podcast-Bot.git
cd Podcast-Bot
npm install
nexe index.js --bundle --build --resource "./node_modules/**/*"
```


Now you must configure the bot before running using indexConfig example file:
```bash
mv config.json.example config.json
```
## Simple Configuration (Required)
Only top 2 required to change for basic functionality. Input predefined discord moderators by right clicking on discord, and click "copy id", then paste it into the moderators list.

```json
{
    "discordToken": "",
    "moderators": [
        ""
    ]
}
```

### Discord Bot Setup
Ensure that you have privelaged gateway intents enabled on your [developer portal](https://discord.com/developers/applications)
![image](https://user-images.githubusercontent.com/73214439/115173596-7e487a00-a07c-11eb-9877-f2cf1441ee75.png)