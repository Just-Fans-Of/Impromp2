var keys = require('./keys.js');
var config = require('./config.js');

var Discord = require('discord.io');


/**** Bot Initialization ****/
process.title = "justfansofbot";
if(process.argv.filter(c => c == '-s' || c == '--silent').length > 0) {
    console.log = () => {};
}

var bot = new Discord.Client({
    autorun: false,
    token: keys.discord,
});

console.log('Connecting...');
bot.connect();


bot.active = () => {
    return bot.connected && bot.presenceStatus == "online";
};

// Make a temporary channel name with the flag additions
bot.createTemporaryChannelName = (name) => {
    if (config.tempChannelFlagLocation == 'start') {
        return config.tempChannelNameFlag + name;
    }
    else {
        return name + config.tempChannelNameFlag;
    }
}
// Remove the temporary flag addition from a name to get just the rest
bot.scrubTemporaryFlag = (name) => {
    if (config.tempChannelFlagLocation == 'start') {
        return name.substring(config.tempChannelNameFlag.length);
    }
    else {
        return name.substring(0, name.length - config.tempChannelNameFlag.length);
    }
}

// Check if name is a temporary channel
bot.isChannelTemporary = (name) => {
    if (config.tempChannelFlagLocation == 'start') {
        return name.startsWith(config.tempChannelNameFlag);
    }
    else {
        return name.endsWith(config.tempChannelNameFlag);
    }
}

bot.createTemporaryChannel = (name, guildID) => {
    bot.createChannel({
        serverID: guildID,
        name: bot.createTemporaryChannelName(name),
        type: 'voice',
    }, (err,res) => {
        if (err) console.error('Error creating temporary channel:', err);
    });

    // TODO info and permissions
};

var listOfUsersByGames = {}; // { serverID: { gameName: [userID, userID] } }
var listOfTempChannels = {}; // channelID: age

bot.on('ready', (evt) => {
    console.log('Logged in as %s - %s', bot.username, bot.id);
    console.log("Go to https://discordapp.com/api/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=0 to add bot to a server");
    checkTemporaryChannels();
    bot.tempCheckInterval = setInterval(checkTemporaryChannels, config.tempChannelCheckInterval);

    // Check users in game to add to list
    if (config.autoCreateByGame) {
        Object.keys(bot.servers).forEach(gid => {
            listOfUsersByGames[gid] = {};
            var server = bot.servers[gid];
            Object.keys(server.members).forEach(uid => {
                var user = server.members[uid];
                if (user.game) {
                    if (listOfUsersByGames[gid][user.game.name] == undefined)
                        listOfUsersByGames[gid][user.game.name] = [];

                    listOfUsersByGames[gid][user.game.name].push(uid);
                }
            });
        });

        checkCommonGames();
    }
});

bot.on('disconnect', () => {
    console.log('Disconnected');
    
    if (config.autoReconnect) {
        console.log('Reconnecting in', config.autoReconnectInterval/1000, 'seconds');
        setTimeout(()=>bot.connect(), config.autoReconnectInterval)
    }
});

bot.on('any', (evt) => {
    // We are joining a server
    // Also fires on already-joined servers when starting up
    if (evt.t == 'GUILD_CREATE') {
        // Check if config entry exists for this server
        // If it doesn't, create one based off default
        
    }

    // We are leaving a server
    else if(evt.t == 'GUILD_DELETE') {
        // Maybe delete config, probably not
    }
});

/**** Command Initialization ****/
var normalizedPath = require("path").join(__dirname, "cmds");
var cmds = [];
require("fs").readdirSync(normalizedPath).forEach(function(file) {
    if (file.endsWith('.js')){
        var Clazz = require('./cmds/' + file);
        cmds.push( new Clazz(bot, config) );
    }
});


/**** Command handling ****/
bot.on('message', (user, userID, channelID, msg, evt) => {

    var channel = bot.channels[evt.d.channel_id]
    if (channel == undefined) return; // Is a direct message, don't do anything

    var lower = msg.toLowerCase();
    var server = bot.servers[channel.guild_id];
    cmds.forEach(cmd => {
        if (lower.startsWith(config.commandPrefix + cmd.command)) {
            if (cmd.checkUserPermissions(userID, server)){
                cmd.onCommandEntered(msg, user, userID, channel.guild_id, evt.d.channel_id); // @TODO rewrite cmds to take objects sensibly?
            }
            else {
                bot.sendMessage({
                    to: channelID,
                    message: user + ": You do not have permission to execute that command",
                });
            }
        }
    });
});




/**** Auto-channel creation ****/
if (config.autoCreateByGame) {
    bot.on('presence', (user, uid, status, game, evt) => {
        // First check if user is allowed to cause temp game channels
        var server = bot.servers[evt.d.guild_id];
        if (listOfUsersByGames[evt.d.guild_id] == undefined)
            listOfUsersByGames[evt.d.guild_id] = {};

        var serverListOfUsersByGames = listOfUsersByGames[evt.d.guild_id];

        if (bot.inRoles(server, evt.d.roles, config.autoCreateByGameRoles)) {
            var game = evt.d.game;
            // Add user to game list if playing game
            if (game != null) {
            
                // Check if game is exempt
                if (config.exemptAutoCreateGames.indexOf(game.name) !== -1) return;

                if(!serverListOfUsersByGames[game.name]) serverListOfUsersByGames[game.name] = [];
                serverListOfUsersByGames[game.name].push(uid);
                checkCommonGames();
            }

            // User not playing game, remove
            else if (game == null) {
                Object.keys(serverListOfUsersByGames).forEach(gameName => {
                    var userList = serverListOfUsersByGames[gameName];
                    if (userList.indexOf(uid) >= 0) {
                        userList.splice(userList.indexOf(uid), 1);
                    }
                });
            }

        }
    });
}

function getNumberOfUsersPlayingGame(gameName, guildID){
    if (!listOfUsersByGames[guildID]) return 0;
    if (!listOfUsersByGames[guildID][gameName]) return 0;
    return listOfUsersByGames[guildID][gameName].length;
}

function checkCommonGames() {
    Object.keys(listOfUsersByGames).forEach(serverID => {
        var serverListOfUsersByGames = listOfUsersByGames[serverID];
        Object.keys(serverListOfUsersByGames).forEach(gameName => {
            var entry = serverListOfUsersByGames[gameName];
            // There is at least autoCreateByGameCommon people playing this game
            if (entry.length >= config.autoCreateByGameCommon) {

                // Check if there is already a channel
                var filter = Object.keys(bot.servers[serverID].channels).filter(cid => {
                    var channel = bot.channels[cid];
                    return channel.name.indexOf(gameName) !== -1;
                });
                if (filter.length == 0)  {
                    console.log("Creating channel for players playing", gameName);
                    bot.createTemporaryChannel(' ' + gameName, serverID);
                }
            }
        });
    });
}

/**** Temporary-channel destruction ****/

function checkTemporaryChannels() {
    if (bot && bot.active()) {
        
        Object.keys(bot.channels).map(chanID => {
            var channel = bot.channels[chanID];

            // Check if is temp channel
            if (channel.type == 'voice' && bot.isChannelTemporary(channel.name)) {
                // Add to age
                if (listOfTempChannels[chanID] != undefined) {
                    // check number of users
                    if (Object.keys(channel.members).length == 0) {

                        // Check to see if game was created for common-games
                        if (config.autoCreateByGame) {
                            var gameName = bot.scrubTemporaryFlag(channel.name);
                            if (getNumberOfUsersPlayingGame(gameName, channel.guild_id) >= config.autoCreateByGameCommon) {
                                listOfTempChannels[chanID] = 0;
                                return;
                            }
                        }

                        listOfTempChannels[chanID] += config.tempChannelCheckInterval;
                        if (listOfTempChannels[chanID] >= config.tempChannelTimeout) {
                            console.log('Channel expiring:', channel.name);
                            bot.deleteChannel(chanID, (err, res) => {
                                if (err) console.error('Error deleting temporary channel:', err);
                            });
                            delete listOfTempChannels[chanID];
                        }
                    }
                    else {
                        listOfTempChannels[chanID] = 0;
                    }
                }
                else
                    listOfTempChannels[chanID] = 0;
            }
        });
    }
};


// Checks if any of the roles in roleIDs is in the list of roles
// Second param is comma-delimted string
bot.inRoles = function(server, roleIDs, roles) {
    for(var i = 0; i < roleIDs.length; i++ ){
        var roleString = server.roles[roleIDs[i]].name;
        var filter = roles.filter(r => roleString == r);
        if (filter.length > 0) return true;
    }
    return false;
}


// Cleanup
function exitHandler(options, err) {
    console.log(options.evt, "Shutting down...");
    if (err) console.log(err.stack);
    if (bot) bot.disconnect();
    if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true, evt:'exit'}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true, evt:'SIGINT'}));
process.on('SIGTERM', exitHandler.bind(null, {exit:true, evt:'SIGTERM'}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true, evt:'exception'}));
