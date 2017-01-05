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

        var split = message.split(' ');
        var givenName = username + "'s Channel";

        // Check if user is in game, then name it that
        var user = this.bot.users[uid];
        if (user.game !== null) {
            givenName = user.game.name;
        }

        // Check if name is defined, use that
        if (split.length > 1) givenName = split.slice(1, split.length).join(' ');

        var channelName = (this.config.entries[gid].tempChannelHaveName ? username + ': ':' ') +
                          givenName;

        this.bot.createTemporaryChannel(channelName, gid, (err) => {
            if (err && err.statusCode && err.statusCode == 403) {
                this.bot.sendMessage({
                    to: cid,
                    message: 'I seem to be unable to add a channel, perhaps I have yet to be given the proper permissions?',
                });
            }
        });
    }

    checkUserPermissions(uid, server) {
        return this.bot.isAdministrator(server.id, uid) ||
                this.bot.inRoles(server, server.members[uid].roles, this.config.entries[server.id].commandPermissions['create']);
    }
}

module.exports = Create;
