'use strict';

/*
 * /create [name] - Creates a voice-chat channel. Optionally names it, otherwise names it Username-[current game]
 *
 */

class Create{
    constructor (bot) {
        this.bot = bot;
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
    }

    checkUserPermissions(uid, server) {
        return true;
    }
}

module.exports = Create;
