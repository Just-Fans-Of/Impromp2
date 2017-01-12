'use strict';

/*
 * /serverCount - Admin only. Gets the number of servers currently connected to.
 *
 */

class Create{
    constructor (bot, config) {
        this.bot = bot;
        this.config = config;
    }

    get command () { return 'servercount'; }

    // Message input, user id <snowflake>, guild id <snowflake>, channel id <snowflake>
    onCommandEntered(message, username, uid, gid, cid) {

        this.bot.sendMessage({
            to: cid,
            message: '<@!' + uid + '> Currently connected to ' + Object.keys(this.bot.servers).length + ' servers.',
        });
    }

    checkUserPermissions(uid, server) {
        return this.bot.isGlobalAdministrator(uid);
    }
}

module.exports = Create;
