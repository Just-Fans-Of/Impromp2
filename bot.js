var Discord = require('discord.io');
var winston = require('winston');

var main = require('./index.js');
var config = main.config;
var keys = main.keys;

/**** Bot Initialization ****/
var bot = new Discord.Client({
    autorun: false,
    token: keys.discord,
});

winston.info('Connecting...');
bot.connect();
module.exports = bot;

bot.active = () => {
    return bot.connected && bot.presenceStatus == "online";
};

// Make a temporary channel name with the flag additions
bot.createTemporaryChannelName = (name, guild_id) => {
    if (config.entries[guild_id].tempChannelFlagLocation == 'start') {
        return config.entries[guild_id].tempChannelNameFlag + name;
    }
    else {
        return name + config.entries[guild_id].tempChannelNameFlag;
    }
}
// Remove the temporary flag addition from a name to get just the rest
bot.scrubTemporaryFlag = (name, guild_id) => {
    if (config.entries[guild_id].tempChannelFlagLocation == 'start') {
        return name.substring(config.entries[guild_id].tempChannelNameFlag.length + 1);
    }
    else {
        return name.substring(0, name.length - config.entries[guild_id].tempChannelNameFlag.length);
    }
}

// Check if name is a temporary channel
bot.isChannelTemporary = (name, guild_id) => {
    if (config.entries[guild_id].tempChannelFlagLocation == 'start') {
        return name.startsWith(config.entries[guild_id].tempChannelNameFlag);
    }
    else {
        return name.endsWith(config.entries[guild_id].tempChannelNameFlag);
    }
}

bot.createTemporaryChannel = (name, guildID, callback) => {
    bot.createChannel({
        serverID: guildID,
        name: bot.createTemporaryChannelName(name, guildID),
        type: 'voice',
    }, (err,res) => {
        if (err) {
            if (err.statusCode == undefined || err.statusCode != 403) { // Don't have permission
                winston.error('Error creating temporary channel:', err);
            }
            callback(err);

        }
        else if (callback) callback();
    });

    // TODO info and permissions
};

var listOfUsersByGames = {}; // { serverID: { gameName: [userID, userID] } }
var listOfTempChannels = {}; // channelID: age

bot.on('ready', (evt) => {
    winston.info('Logged in as %s - %s', bot.username, bot.id);
    winston.info("Go to https://discordapp.com/api/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=0 to add bot to a server");
    checkTemporaryChannels();
    bot.tempCheckInterval = setInterval(checkTemporaryChannels, config.global.tempChannelCheckInterval);

    // Check users in game to add to list
    Object.keys(bot.servers).forEach(gid => {
        if (!config.entries[gid].autoCreateByGame) return;
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

        checkCommonGames(gid);
    });

});

bot.on('disconnect', () => {
    winston.info('Disconnected');
    
    if (config.global.autoReconnect) {
        winston.info('Reconnecting in', config.global.autoReconnectInterval/1000, 'seconds');
        setTimeout(()=>bot.connect(), config.global.autoReconnectInterval)
    }
});

bot.on('any', (evt) => {
    // We are joining a server
    // Also fires on already-joined servers when starting up
    if (evt.t == 'GUILD_CREATE') {
        // Check if config entry exists for this server
        // If it doesn't, create one based off default

        if (!config.entries[evt.d.id]){
            config.createNew(evt.d.id, evt.d.name);
        }
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
    cmds.some(cmd => {
        if (lower.startsWith(config.entries[channel.guild_id].commandPrefix + cmd.command)) {
            if (cmd.checkUserPermissions(userID, server)){
                cmd.onCommandEntered(msg, user, userID, channel.guild_id, evt.d.channel_id); // @TODO rewrite cmds to take objects sensibly?
            }
            else {
                bot.sendMessage({
                    to: channelID,
                    message: user + ": You do not have permission to execute that command",
                });
            }

            return true;
        }
        return false;
    });
});




/**** Auto-channel creation ****/
bot.on('presence', (user, uid, status, game, evt) => {
    var guild_id = evt.d.guild_id;

    if(!config.entries[guild_id].autoCreateByGame) return;

    // First check if user is allowed to cause temp game channels
    var server = bot.servers[guild_id];
    if (listOfUsersByGames[guild_id] == undefined)
        listOfUsersByGames[guild_id] = {};

    var serverListOfUsersByGames = listOfUsersByGames[guild_id];

    if (bot.inRoles(server, evt.d.roles, config.entries[guild_id].autoCreateByGameRoles)) {
        var game = evt.d.game;
        // Add user to game list if playing game
        if (game != null) {
        
            // Check if game is exempt
            if (config.entries[guild_id].exemptAutoCreateGames.indexOf(game.name) !== -1) return;

            if(!serverListOfUsersByGames[game.name]) serverListOfUsersByGames[game.name] = [];
            serverListOfUsersByGames[game.name].push(uid);
            checkCommonGames(guild_id);
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

function getNumberOfUsersPlayingGame(gameName, guildID){
    if (!listOfUsersByGames[guildID]) return 0;
    if (!listOfUsersByGames[guildID][gameName]) return 0;
    return listOfUsersByGames[guildID][gameName].length;
}

function checkCommonGames(serverID) {
    if (!config.entries[serverID].autoCreateByGame) return;

    Object.keys(listOfUsersByGames[serverID]).forEach(gameName => {
        // There is at least autoCreateByGameCommon people playing this game
        if (getNumberOfUsersPlayingGame(gameName, serverID) >= config.entries[serverID].autoCreateByGameCommon) {

            // Check if there is already a channel
            var filter = Object.keys(bot.servers[serverID].channels).filter(cid => {
                var channel = bot.channels[cid];
                return channel.name.indexOf(gameName) !== -1;
            });
            if (filter.length == 0)  {
                bot.createTemporaryChannel(' ' + gameName, serverID);
            }
        }
    });
}

/**** Temporary-channel destruction ****/

function checkTemporaryChannels() {
    if (bot && bot.active()) {
        
        Object.keys(bot.channels).map(chanID => {
            var channel = bot.channels[chanID];
            var guild_id = channel.guild_id;

            // Check if is temp channel
            if (channel.type == 'voice' && bot.isChannelTemporary(channel.name, guild_id)) {
                // Add to age
                if (listOfTempChannels[chanID] != undefined) {
                    // check number of users
                    if (Object.keys(channel.members).length == 0) {

                        // Check to see if game was created for common-games
                        if (config.entries[guild_id].autoCreateByGame) {
                            var gameName = bot.scrubTemporaryFlag(channel.name, guild_id);
                            if (getNumberOfUsersPlayingGame(gameName, guild_id) >= config.entries[guild_id].autoCreateByGameCommon) {
                                listOfTempChannels[chanID] = 0;
                                return;
                            }
                        }

                        listOfTempChannels[chanID] += config.global.tempChannelCheckInterval;
                        if (listOfTempChannels[chanID] >= config.entries[guild_id].tempChannelTimeout) {
                            bot.deleteChannel(chanID, (err, res) => {
                                if (err && (!err.statusCode || err.statusCode != 403))
                                    winston.error('Error deleting temporary channel:', err);
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
        var roleID = roleIDs[i];
        var filter = roles.filter(r => roleID == r);
        if (filter.length > 0) return true;
    }
    return false;
};

function hasPermission(bit, perm) {
    return ((perm >> bit) & 1) == 1;
}

bot.isAdministrator = function(guild_id, user_id) {
    var server = bot.servers[guild_id];
    var member = server.members[user_id];
    if (member) {
        for (var i in Object.keys(member.roles)) {
            var role = server.roles[member.roles[i]];
            if ( hasPermission(Discord.Permissions.GENERAL_ADMINISTRATOR, role._permissions) )
                return true;
        }
    }

    return false;
};

