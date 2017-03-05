'use strict';

/*
 * /config property value - Sets server config property to value
 * If no value is given, it will spit out the current value
 * If no property is given, it will spit out all available properties
 *
 */

class Config{
    constructor (bot, config) {
        this.bot = bot;
        this.config = config;
    }

    get command () { return 'config' }

    printFailResponse (username, uid, gid, cid) {
        var cmd = this.config.entries[gid].commandPrefix + this.command;
        this.bot.sendMessage({
            to: cid,
            message: "Usage error. Type `" + cmd + "` to see usage.",
        });
    }

    printUsage (username, uid, gid, cid) {
        
        var cmd = this.config.entries[gid].commandPrefix + this.command;
        var helpMessage = [
            "**Usage: **`" + cmd + " [action] [key] [value]`",
            "**Actions: ** `get, set, add, remove`",
            "  * *Array properties require add or remove*",
            "**Keys:**",
            "  - `commandPrefix [String]`: The character used to denote a command. Typically /, !, or $. Default: /",
            "  - `autoCreateByGame [true/false]`: Whether to create channels when enough people are playing the same game. Default: true",
            "  - `autoCreateByGameCommon [Integer]`: Minimum # of people playing the same game before creating a channel. Default: 4",
            "  - `autoCreateByGameRoles [Array<Role Name>]`: Limit the detected people for game-channel creation to specific roles",
            "  - `exemptAutoCreateGames [Array<String>]`: List of game names that I won't create channels for automatically",
            "  - `tempChannelTimeout [Integer]`: Number of seconds to wait before deleting an empty temporary channel. Default: 30",
            "  - `tempChannelNameFlag [String]`: What to add to a temporary channel name to signify it is temporary. Default: 💣",
            "  - `tempChannelFlagLocation [String]`: Where to put the flag, either start or end. Default: end",
            "  - `permission.create [Array<Role Name>]`: Who can run the `create` command. Administrators always can.",
            "  - `permission.config [Array<Role Name>]`: Who can run the `config` command. Administrators always can.",
            "  - `tempChannelPermissions [Name of another channel]`: Copy the permissions of another channel for temporary channels. The channel can be deleted afterwards",
            "**Examples:**",
            "  - `" + cmd + " set autoCreateByGame false`",
            "  - `" + cmd + " get tempChannelNameFlag`",
            "  - `" + cmd + " add permissions.create SuperAdministratorSquad`",
            "  - `" + cmd + " set tempChannelPermissions Temp permission channel`",
        ];
        this.bot.sendMessage({
            to: cid,
            message: helpMessage.join('\n\n'),
        });
    }

    // A whole bunch of helper functions for making input to and output from config easier by type

    getRoles(gid, key) {
        var roles = this.bot.servers[gid].roles;
        return "**" + key + "**: [\n" + 
            // map to role names
            this.config.entries[gid].getValue(key).map(roleID => {
                return '  - `' + roles[roleID].name + '`';
            }).join('\n') + '\n]';
    }
    addRole(gid, key, val) {
        var roles = this.bot.servers[gid].roles;
        var filter = Object.keys(roles).filter(roleID => {
            var role = roles[roleID];
            return role.name == val;
        });

        if (filter.length == 0) {
            return "Role not found.";
        }
        // @TODO Have option for entering role id when roles share a name?
        else {
            var arr = this.config.entries[gid].getValue(key);
            var ind = arr.indexOf(filter[0]);
            if (ind == -1) {
                arr.push(filter[0]);
                this.config.entries[gid].setValue(key,arr);
                return "Role " + val + " added to " + key;
            }
            else {
                return key + " already contains role " + val;
            }
        }
    }
    removeRole(gid, key, val) {
        var roles = this.bot.servers[gid].roles;
        var filter = Object.keys(roles).filter(roleID => {
            var role = roles[roleID];
            return role.name == val;
        });

        if (filter.length == 0) {
            return "Role not found.";
        }
        // @TODO Have option for entering role id when roles share a name?
        else {
            var arr = this.config.entries[gid].getValue(key);
            var ind = arr.indexOf(filter[0]);
            if (ind != -1) {
                arr.splice(ind, 1);
                this.config.entries[gid].setValue(key,arr);
                return "Role " + val + " removed from " + key;
            }
            else {
                return key + " does not contain role " + val;
            }
        }
    }

    getCmdRoles(gid, key) {
        var roles = this.bot.servers[gid].roles;
        return "**permissions." + key + "**: [\n" + 
            // map to role names
            this.config.entries[gid].commandPermissions[key].map(roleID => {
                if (roles[roleID] == undefined) return '';
                return '  - `' + roles[roleID].name + '`';
            });
    }
    addCmdRole(gid, key, val) {
        var roles = this.bot.servers[gid].roles;
        var filter = Object.keys(roles).filter(roleID => {
            var role = roles[roleID];
            return role.name == val;
        });

        if (filter.length == 0) {
            return "Role not found.";
        }
        // @TODO Have option for entering role id when roles share a name?
        else {
            var arr = this.config.entries[gid].commandPermissions[key];
            var ind = arr.indexOf(filter[0]);
            if (ind == -1) {
                arr.push(filter[0]);
                this.config.entries[gid]._dirty = true;
                return "Role " + val + " added to command " + key;
            }
            else {
                return key + " already contains role " + val;
            }

        }
    }
    removeCmdRole(gid, key, val) {
        var roles = this.bot.servers[gid].roles;
        var filter = Object.keys(roles).filter(roleID => {
            var role = roles[roleID];
            return role.name == val;
        });

        if (filter.length == 0) {
            return "Role not found.";
        }
        // @TODO Have option for entering role id when roles share a name?
        else {
            var arr = this.config.entries[gid].commandPermissions[key];
            var ind = arr.indexOf(filter[0]);
            if (ind != -1) {
                arr.splice(ind, 1);
                this.config.entries[gid]._dirty = true;
                return "Role " + val + " removed from command " + key;
            }
            else {
                return key + " does not contain role " + val;
            }
        }
    }


    getArrayString(gid, key) {
        return "**" + key + "**: [\n" + 
            // map to role names
            this.config.entries[gid].getValue(key).map(val => {
                return '  - `' + val + '`';
            }).join('\n') + '\n]';
    }

    addArrayString(gid, key, val) {
        var arr = this.config.entries[gid].getValue(key);
        var ind = arr.indexOf(val);
        if (ind == -1) {
            arr.push(val);
            this.config.entries[gid]._dirty = true;
            return val + " added to " + key;
        }
        else {
            return key + " already contains " + val;
        }
    }
    removeArrayString(gid, key, val) {
        var arr = this.config.entries[gid].getValue(key);
        var ind = arr.indexOf(val);
        if (ind != -1) {
            arr.splice(ind, 1);
            this.config.entries[gid]._dirty = true;
            return val + " removed from " + key;
        }
        else {
            return key + " does not contain " + val;
        }
    }

    getKey(gid, key) {
        return "**" + key + "**: " + this.config.entries[gid].getValue(key);
    }
    getSecondsKey(gid, key) {
        return "**" + key + "**: " + (this.config.entries[gid].getValue(key)/1000).toString();
    }
    setKey(gid, key,value) {
        this.config.entries[gid].setValue(key, value);
        return "**" + key + "** set to `" + (value/1000) + "`";
    }

    handleStringKey(username, uid, gid, cid, key, split, action, message) {
        var res;
        if (action == "get") {
            res = this.getKey(gid, key);
        }
        else if (action == "set") {
            var val = split.slice(3,split.length);
            // if (message[message.length-1] == ' ') val += ' ';
            this.config.entries[gid].setValue(key, val);
            res = "**" + key + "** set to `" + val + "`";
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleBoolKey(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getKey(gid, key);
        }
        else if (action == "set") {
            res = this.setKey(gid, key, split[3] == 'true');
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleIntKey(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getKey(gid, key);
        }
        else if (action == "set") {
            var parse = parseInt(split[3]);
            if (parse == NaN) res = "**Error**: value is not a number";
            else res = this.setKey(gid, key, parse);
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleSecondsKey(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getSecondsKey(gid, key);
        }
        else if (action == "set") {
            var parse = parseInt(split[3]);
            if (parse == NaN) res = "**Error**: value is not a number";
            else res = this.setKey(gid, key, parse * 1000);
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleArrayStringKey(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getArrayString(gid, key);
        }
        else if (action == "add") {
            res = this.addArrayString(gid, key, split.slice(3, split.length).join(' '));
        }
        else if (action == "remove") {
            res = this.removeArrayString(gid, key, split.slice(3, split.length).join(' '));
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleArrayRolesKey(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getRoles(gid, key);
        }
        else if (action == "add") {
            res = this.addRole(gid, key, split.slice(3, split.length).join(' '));
        }
        else if (action == "remove") {
            res = this.removeRole(gid, key, split.slice(3, split.length).join(' '));
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleCmdRoles(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            res = this.getCmdRoles(gid, key);
        }
        else if (action == "add") {
            res = this.addCmdRole(gid, key, split.slice(3, split.length).join(' '));
        }
        else if (action == "remove") {
            res = this.removeCmdRole(gid, key, split.slice(3, split.length).join(' '));
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }

    handleChannelPermissions(username, uid, gid, cid, key, split, action) {
        var res;
        if (action == "get") {
            this.bot.sendMessage({
                to: cid,
                message: "Cannot use get on " + key,
            });
        }
        else if (action == "set") {
            var channelName = split.slice(3, split.length).join(' ');
            var server = this.bot.servers[gid];
            var find = Object.keys(server.channels).filter(channelID => {
                return server.channels[channelID].name == channelName;
            });

            if (find.length == 0) { 
                res = "Channel not found.";
            }
            else if (find.length == 0) {
                res = "Multiple channels found by that name.";
            }
            else {
                res = "Copying channel permissions of " + channelName + " for future temporary channels."
                var channel = server.channels[find[0]];
                this.config.entries[gid].tempChannelPermissions = channel.permissions;
            }
          
        }
        else {
            this.printFailResponse(username, uid, gid, cid);
            return;
        }
        if (res){
            this.bot.sendMessage({
                to: cid,
                message: res,
            });
        }
    }


    // Message input, user id <snowflake>, guild id <snowflake>, channel id <snowflake>
    onCommandEntered(message, username, uid, gid, cid) {

        var split = message.split(' ');
        
        // Help
        if (split.length == 1) {
            this.printUsage(username, uid, gid, cid);
        }
        else if (split.length < 3) {
            this.printFailResponse(username, uid, gid, cid);
        }
        else {
            var action = split[1].toLowerCase();
            var key = split[2].toLowerCase();

            if (action != "get" && split.length == 3) {
                this.printFailResponse(username, uid, gid, cid);
                return;
            }

            var res = undefined;
            switch(key) {
                // string
                case 'commandprefix':
                    key = 'commandPrefix';
                    this.handleStringKey(username, uid, gid, cid, key, split, action, message); break;
                case 'tempchannelnameflag':
                    key = 'tempChannelNameFlag',
                    this.handleStringKey(username, uid, gid, cid, key, split, action); break;
                case 'tempchannelflaglocation':
                    key = 'tempchannelFlagLocation';
                    this.handleStringKey(username, uid, gid, cid, key, split, action); break;

                // bool
                case 'autocreatebygame':
                    key = 'autoCreateByGame';
                    this.handleBoolKey(username, uid, gid, cid, key, split, action); break;

                // int
                case 'autocreatebygamecommon':
                    key = 'autoCreateByGameCommon';
                    this.handleIntKey(username, uid, gid, cid, key, split, action); break;

                // Special int, mult 1000
                case 'tempchanneltimeout':
                    key = 'tempChannelTimeout';
                    this.handleSecondsKey(username, uid, gid, cid, key, split, action); break;

                // Array<string>
                case 'exemptautocreategames':
                    key = 'exemptAutoCreateGames';
                    this.handleArrayStringKey(username, uid, gid, cid, key, split, action); break;
                    
                // Array<Role>
                case 'autocreatebygameroles':
                    key = 'autoCreateByGameRoles';
                    this.handleArrayRolesKey(username, uid, gid, cid, key, split, action); break;

                // Special Array<Role>: commands
                case 'permission.create':
                    key = "create";
                    this.handleCmdRoles(username, uid, gid, cid, key, split, action); break;
                case 'permission.config':
                    key = "config";
                    this.handleCmdRoles(username, uid, gid, cid, key, split, action); break;
                
                // Temp channel permissions
                case 'tempchannelpermissions':
                    key = "tempChannelPermissions";
                    this.handleChannelPermissions(username, uid, gid, cid, key, split, action); break;

                default:
                    var cmd = this.config.entries[gid].commandPrefix + this.command;
                    this.bot.sendMessage({
                        to: cid,
                        message: "Invalid key. Type `" + cmd + "` to see list of keys",
                    });
                    break;

            }
        }


    }

    checkUserPermissions(uid, server) {
        return this.bot.isAdministrator(server.id, uid) ||
                this.bot.inRoles(server, server.members[uid].roles, this.config.entries[server.id].commandPermissions['config']);
    }
}

module.exports = Config;

