# Notion notifications in Telegram

Telegram bot checks updates of Notion space and sends message to Telegram. </br>
You can change target to any messenger.

## Installation

Must be .env file in root

```
notion_token= # Token from Notion in cookies (token_v2)
notion_space= # Notion space id from Network tab -> XHR -> POST request -> body
bot_token= # Your telegram BOT token
bot_chat= # Target Telegram Chat
```

```
npm start
```

