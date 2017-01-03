var keys = require('./keys.js');
var config = require('./config.js');

var Discord = require('discord.io');


/**** Bot Initialization ****/
var bot = new Discord.Client({
    autorun: true,
    token: keys.discord,
});

bot.active = () => {
    return bot.connected && bot.presenceStatus == "online";
}

var listOfUsersByGames = {};
var listOfTempChannels = {}; // channelID: age

bot.on('ready', (evt) => {
    console.log('Logged in as %s - %s', bot.username, bot.id);
    checkTemporaryChannels();
    bot.tempCheckInterval = setInterval(checkTemporaryChannels, config.tempChannelCheckInterval);
});

bot.on('disconnect', () => {
    console.log('Disconnected');
    
    if (config.autoReconnect) {
        setTimeout(()=>bot.connect(), config.autoReconnectInterval)
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
        if (lower.startsWith(config.commandPrefix + cmd.command) &&
            cmd.checkUserPermissions(userID, server)) {
            cmd.onCommandEntered(msg, user, userID, channel.guild_id, evt.d.channel_id); // @TODO rewrite cmds to take objects sensibly?
        }
    });
});




/**** Auto-channel creation ****/
bot.on('presence', (user, uid, status, game, evt) => {
    // First check if user is allowed to cause temp game channels
    var server = bot.servers[evt.d.guild_id];
    if (inRoles(server, evt.d.roles, config.autoCreateByGameRoles)) {
        console.log("In role");
        var game = evt.d.game;
        // Add user to game list if playing game
        if (game != null) {
           if(!listOfUsersByGames[game.name]) listOfUsersByGames[game.name] = [];
           listOfUsersByGames[game.name].push(uid);
           console.log("Adding user. ", listOfUsersByGames);
           checkCommonGames();
        }

        // User not playing game, remove
        else if (game == null) {
            console.log("no game");
            Object.keys(listOfUsersByGames).forEach(gameName => {
                var userList = listOfUsersByGames[gameName];
                console.log('userlistInd', userList.indexOf(uid));
                if (userList.indexOf(uid) >= 0) {
                    userList.splice(userList.indexOf(uid), 1);
                   console.log("Removing user. ", listOfUsersByGames);
                }
            });
        }

    }


});


function checkCommonGames() {

}

/**** Temporary-channel destruction ****/

function checkTemporaryChannels() {
    if (bot && bot.active()) {
        
        Object.keys(bot.channels).map(chanID => {
            var channel = bot.channels[chanID];

            // Check if is temp channel
            if (channel.name.startsWith('$')){
                // Add to age
                if (listOfTempChannels[chanID]) {
                    // check number of users
                    if (channel.members.length == 0) {
                        listOfTempChannels[chanID] += config.tempChannelCheckInterval;
                        console.log("Adding to age " + listOfTempChannels[chanID]);
                        if (listOfTempChannels[chanID] >= config.tempChannelTimeout) {
                            var server = bot.servers[channel.guild_id];
                                           
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
function inRoles(server, roleIDs, roles) {
    roles = roles.split(',').map(s => s.trim());
    for(var i = 0; i < roleIDs.length; i++ ){
        var roleString = server.roles[roleIDs[i]].name;
        var filter = roles.filter(r => roleString == r);
        console.log( "Role string", roleString, roles, filter.length);
        if (filter.length > 0) return true;
    }
    return false;
}


// Cleanup
function exitHandler(options, err) {
    if (err) console.log(err.stack);
    if (bot) bot.disconnect();
    if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
