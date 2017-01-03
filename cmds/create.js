'use strict';

/*
 * /create [name] - Creates a voice-chat channel. Optionally names it, otherwise names it Username-[current game]
 *
 */

class Create{
    constructor (bot, config) {
        this.bot = bot;
        this.config = config;
    }

    get command () { return 'create' }

    // Message input, user id <snowflake>, guild id <snowflake>, channel id <snowflake>
    onCommandEntered(message, username, uid, gid, cid) {
        console.log("Got command, sending");
        this.bot.sendMessage({
            to: cid,
            message: 'Hello ' + username + ' [' + message + ']', 
        }, (err, res) => {
            console.log('CB', err, res);
        });

        var split = message.split(' ');
        var givenName = 'Temporary Channel';
        if (split.length > 1) split.slice(0, split.length).join(' ');

        var channelName = this.config.tempChannelNamePrefix + username + ': ' + givenName;

        console.log('Creating channel', channelName);
    }

    checkUserPermissions(uid, server) {
        return true;
    }
}

module.exports = Create;
