require('dotenv').config({ path: './.env' });
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

// Config Axios for auth in Notion

axiosCookieJarSupport(axios);
const cookieJar = new tough.CookieJar();
cookieJar.setCookie(`token_v2=${process.env.notion_token}; Path=/; Domain=.notion.so; Expires=Mon, 24 May 2021 16:58:03 GMT;`, 'https://notion.so');

// Start Bot

const bot = new TelegramBot(process.env.bot_token, {
    polling: true,
    request: {
        agentClass: Agent,
        agentOptions: {
            socksHost: '127.0.0.1',
            socksPort: '9050',
            socksUsername: '',
            socksPassword: '',
        }
    }
});

// Check your chat ID (uncomment)

// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // send a message to the chat acknowledging receipt of their message
//     bot.sendMessage(chatId, 'Your Chat ID: ' + chatId);
// });


// Start checking with interval

let lastHistory;
let newActivities = [];
let i = 1;

setInterval(() => {
    axios({
        method: 'post',
        url: 'https://www.notion.so/api/v3/getActivityLog',
        data: {
            "spaceId": "c20a6081-6179-4da2-8610-d21b0d10d4b8",
            "limit": 100
        },
        jar: cookieJar,
        withCredentials: true
    })
        .then((res) => {
            const data = res.data;
            const history = data.recordMap.activity;

            if (i > 1) {
                newActivities = [];

                // Find new history items

                for (let historyKey in history) {
                    const historyItem = history[historyKey];

                    if (historyItem.role === 'editor') {
                        if (!lastHistory[historyKey]) {
                            newActivities.push(historyItem.value);
                        }
                    }
                }

                // If found, then send a message

                if (newActivities.length > 0) {
                    lastHistory = history;

                    console.log('Update');

                    newActivities.forEach((block) => {
                        bot.sendMessage(process.env.bot_chat, formatActivity(block));
                    });
                }
            } else {
                lastHistory = history;
            }

            i++;
        })
        .catch((err) => {
            console.log(err);
        })
}, 500);

function formatActivity(activity) {
    switch (activity.type) {
        case "block-edited":
            return `🖊 Update
🕑: ${formatDate(new Date(parseInt(activity.end_time)))}

${formatEdits(activity.edits)}`;
            break;
        default:
            return ``
    }
}

function formatEdits(edits) {
    let full = ``;

    edits.forEach((edit) => {
        switch (edit.type) {
            case "block-changed":
                full += strikeThrough(formatBlock(edit.block_data.before.block_value)) + ' ' + formatBlock(edit.block_data.after.block_value) + '\n';
                break;
            case "block-deleted":
                full += strikeThrough(formatBlock(edit.block_data.block_value)) + '\n';
                break;
            default:
                full += '';
        }

    });

    return full;
}

function formatBlock(block) {
    switch (block.type) {
        case "bulleted_list":
            return `${block.properties ? Object.values(block.properties).reduce((acc, val) => acc.concat(val), []).join(' ') : ''}`;
            break;
        default:
            return ``
    }
}

function formatDate(date) {
    return date.toLocaleString();
}

function strikeThrough(text) {
    return text
        .split('')
        .map(char => char + '\u0336')
        .join('')
}