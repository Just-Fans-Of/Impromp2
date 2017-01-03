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


bot.on('ready', (evt) => {
    console.log('Logged in as %s - %s', bot.username, bot.id);
    checkTemporaryChannels();
    bot.tempCheckInterval = setInterval(checkTemporaryChannels, config.tempCheckInterval);
});

bot.on('disconnect', () => {
    console.log('Disconnected');

});

bot.on('message', (user, userID, channelID, msg, evt) => {

    console.log("Got message", msg);
});


bot.on('any', (evt) => {
});

bot.on('presence', (user, uid, status, game, evt) => {
    
});


function checkTemporaryChannels() {
    if (bot && bot.active()) {
        
        Object.keys(bot.channels).map(chanID => {
            var channel = bot.channels[chanID];
            var server = bot.servers[channel.guild_id];
            console.log(server.name, channel.name, channel.type);
        });
    }
};





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
