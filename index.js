const fs = require("fs");
let config;
const { Client, Intents, VoiceChannel } = require('discord.js');

let client = new Client();

let voiceChannel;

client.on('ready', async () => {
    sendCommand({ name: "boot", data: true })
    let serverList = [];
    for (let server of client.guilds.cache) {
        serverList.push({ serverID: server[1].id, serverName: server[1].name });
    }
    sendCommand({ name: "serverList", serverList: serverList })

    await disconnectChannel();
    testCases();

});


const gameStateFile = "./gameState.json";

const commandHistory = new Map();

function testCases() {
    if (config.testServerID) {
        setTimeout(function () {
            let command = { name: "setVC", userID: config.moderators[0], serverID: config.testServerID };
            commandHandler(command);
        }, 2000);

        setTimeout(function () {
            
            command = { name: "monitorTalkTime"};
            commandHandler(command);
        }, 4000);
    }
}

watchFile();

async function watchFile() {
    fs.watch(gameStateFile, (event, filename) => {
        if (filename && event === 'change') {
            fs.readFile(gameStateFile, "utf-8", async function (err, data) {
                if (err) {

                } else {
                    var command = JSON.parse(data);
                    if (!commandHistory.has(command.commandIndex)) {
                        commandHistory.set(command.commandIndex, command);
                        commandHandler(command);
                    }
                }
            })

        }
    });
}




async function commandHandler(command) {
    switch (command.name) {
        case "setVC":
            sendCommand({ name: "log", type:"info", data: "Set VC command sent" });
            setVoiceChannel(command);
            break;
        case "testButton":
            sendCommand({ name: "log", type:"info", data: "Test button sent" });
            break;
        case "setMute":
            setMuteUser(command);
            break;
        case "setDeafen":
            setDeafenUser(command);
            break;
        case "setMuteAll":
            setMuteAll(command);
            break;
        case "setDeafenAll":
            setDeafenAll(command);
            break;
        case "crash":
            await disconnectChannel();
            throw "Crash";
        case "monitorTalkTime":
            monitorTalkTime(command);
            break;
        case "close":
            await disconnectChannel();
            process.exit(0);
            break;
        default:
            break;
    }
}

function monitorTalkTime(command) {
    if (voiceChannel && voiceChannel.joinable == true) {

        voiceChannel.join().then((voiceConnection) => {
                let voiceReceiver = voiceConnection.receiver;
                voiceConnection.on('error', (err) => {
                    // console.log(err)
                    voiceConnection.disconnect();
                    monitorTalkTime(command)
                })
                voiceConnection.on('speaking', (user, speaking) => {
                    var initialTime = Date.now();
                    // console.log(new Date().toISOString(), speaking);
                    const audioStream = voiceReceiver.createStream(user, {
                        mode: 'pcm'
                    });
                    let incrementsRegistered = 0;


                    //Register increments of seconds while the user is talking so we can constantly add to the preview time for that person on the program.
                    //.on('data) is Necessary or else .on("end") event wont register
                    audioStream.on('data', (data) => {
                        let timeSpoken = Date.now() - initialTime;
                        if (Math.floor(timeSpoken / 1000) - incrementsRegistered >= 1) {
                            incrementsRegistered++;
                            // console.log(data)
                            sendCommand({ name: "incrementTalkTime", userID: user.id, time: incrementsRegistered });
                        }
                    })

                    //The final EXACT talk time of the user is sent back to the program to be added to their official talk time,
                    audioStream.on('end', () => {
                        let timeSpoken = Date.now() - initialTime;
                        if (timeSpoken > 100) {
                            sendCommand({ name: "addTalkTime", userID: user.id, time: timeSpoken });
                        }

                    })
                });
        })
    } else {
        sendCommand({ name: "log", type: "error", data: "couldnt join voice channel" });
    }
}

function setMuteAll(command) {
    for (let member of voiceChannel.members) {
        if (command.moderators.indexOf(member[0]) == -1) {
            if (member[1].voice.serverMute != command.data) {
                if (command.data == true) {
                    member[1].voice.setMute(true);
                } else {
                    member[1].voice.setMute(false);
                }
            }
        }
    }
}

function setDeafenAll(command) {
    for (let member of voiceChannel.members) {
        if (command.moderators.indexOf(member[0]) == -1) {
            if (member[1].voice.serverDeaf != command.data) {
                if (command.data == true) {
                    member[1].voice.setDeaf(true);
                } else {
                    member[1].voice.setDeaf(false);
                }
            }
        }
    }
}



function setMuteUser(command) {

    let member = voiceChannel.members.find(member => member.id == command.userID);
    if (member && member.voice.serverMute != command.data) {
        if (command.data == true) {

            member.voice.setMute(true);
        } else {
            member.voice.setMute(false);

        }
    }
}

function setDeafenUser(command) {

    let member = voiceChannel.members.find(member => member.id == command.userID);
    if (member && member.voice.serverDeaf != command.data) {
        if (command.data == true) {
            member.voice.setDeaf(true);
        } else {
            member.voice.setDeaf(false);

        }
    }
}


function sendCommand(command) {
    console.log(JSON.stringify({ command }));
}



/*
Searches guild for member the member with this ID. Useful if you only have userID or user object and need guildMember
*/
async function getGuildMemberFromServerIDAndUserID(serverID, id) {
    let guild = client.guilds.cache.find(guild => guild.id == serverID);
    if (guild) {
        let guildMember = guild.members.cache.find(member => member.id == id);
        return guildMember;
    }
    return;

}

/*
Sets voiceChannel from the defaultGuild.
*/
function setVoiceChannel(command) {
    try {
        let guild = client.guilds.cache.find(guild => guild.id == command.serverID);
        let guildMember = guild.members.cache.find(member => member.id == command.userID);
        if (guildMember.voice) {
            let membersArray = [];
            voiceChannel = guildMember.voice.channel;
            for (let member of voiceChannel.members) {
                membersArray.push({ userID: member[1].id, displayName: member[1].displayName, avatarURL: member[1].user.displayAvatarURL({ format: "jpg" }), muted: member[1].voice.serverMute, deafened: member[1].voice.serverDeaf });
            }

            sendCommand({ name: "voiceChannelMembers", members: membersArray, status: true });
        } else {
            //No voice channel
            sendCommand({ name: "voiceChannelMembers", status: false });
        }
    } catch (err) {
        // console.log("Error loading default textChannel/guild.");
        sendCommand({ name: "voiceChannelMembers", status: false });
    }
}


client.on("voiceStateUpdate", function (oldState, newState) {

    if (oldState.channelID != newState.channelID) { //Channel switch event
        if (voiceChannel && newState.channelID == voiceChannel.id) { //user joined channel
            let member = voiceChannel.members.find(member => member.id == newState.id);
            sendCommand({ name: "userJoinChannel", member: { userID: newState.id, displayName: member.displayName, avatarURL: member.user.displayAvatarURL({ format: "jpg" }), muted: newState.serverMute, deafened: newState.serverDeaf } });


        } else if (voiceChannel && oldState.channelID == voiceChannel.id) { //user left channel
            sendCommand({ name: "userLeftChannel", userID: newState.id });

        }
    } else { //Not channel switch event, so probably change mic
        if (voiceChannel && newState.channelID == voiceChannel.id) {
            if (oldState.serverDeaf != newState.serverDeaf) { //Changed Deafened
                sendCommand({ name: "deafState", deafened: newState.serverDeaf, userID: newState.id });

            } else if (oldState.serverMute != newState.serverMute) {
                sendCommand({ name: "muteState", muted: newState.serverMute, userID: newState.id });
            }
        }
    }


})


async function disconnectChannel() {
    for (const channel of client.channels.cache) {
        if (channel[1].type == "voice") {
            for (const member of channel[1].members) {
                    if (member[0] == client.user.id) {
                    await member[1].voice.channel.join()
                    await member[1].voice.channel.leave();
                }
            }
        }
    }
}


async function bootSequence() {
    fs.readFile("./config.json", "utf-8", async function (err, data) {
        if (err) {

        } else {
            config = JSON.parse(data)
            await client.login(config.discordToken);
            return true;
        }
    })
}

bootSequence().catch(err => console.error(err))
