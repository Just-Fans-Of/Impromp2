var keys = require('./keys.js');
var config = require('./config.js');

var Discord = require('discord.io');

var bot = new Discord.Client({
    autorun: true,
    token: keys.discord,
});

bot.active = () => {
    return bot.connected && bot.presenceStatus == "online";
}

var listOfUsersByGames = {};

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

bot.on('message', (user, userID, channelID, msg, evt) => {

    console.log("Got message", msg);
});


bot.on('any', (evt) => {
});

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

function checkTemporaryChannels() {
    if (bot && bot.active()) {
        
        Object.keys(bot.channels).map(chanID => {
            var channel = bot.channels[chanID];
            var server = bot.servers[channel.guild_id];
            //console.log(server.name, channel.name, channel.type);
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
