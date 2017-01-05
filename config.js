'use strict';

class Config {
    constructor(obj, dirty) {
        this._dirty = dirty || false;
        this._id = obj['_id'];

        this._commandPrefix = obj['commandPrefix'];
        this._autoCreateByGame = obj['autoCreateByGame'];
        this._autoCreateByGameCommon = obj['autoCreateByGameCommon'];
        this._autoCreateByGameRoles = obj['autoCreateByGameRoles'];
        this._exemptAutoCreateGames = obj['exemptAutoCreateGames'];
        
        this._tempChannelTimeout = obj['tempChannelTimeout'];
        this._tempChannelNameFlag = obj['tempChannelNameFlag'];
        this._tempChannelFlagLocation = obj['tempChannelFlagLocation'];

        this._commandPermissions = obj['commandPermissions'];

        this._maxChannelsPerPerson = obj['maxChannelsPerPerson']; // TODO
    }

    getValue(key) {
        return this['_' + key];
    }
    setValue(key, val) {
        this['_' + key] = val;
        this._dirty = true;
    }

    get maxChannelsPerPerson() { return this._maxChannelsPerPerson; }
    set maxChannelsPerPerson(val) { this._dirty = true; this._maxChannelsPerPerson = val; }

    get commandPermissions() { return this._commandPermissions; }
    set commandPermissions(val) { this._dirty = true; this._commandPermissions = val; }

    get tempChannelFlagLocation() { return this._tempChannelFlagLocation; }
    set tempChannelFlagLocation(val) { this._dirty = true; this._tempChannelFlagLocation = val; }

    get tempChannelNameFlag() { return this._tempChannelNameFlag; }
    set tempChannelNameFlag(val) { this._dirty = true; this._tempChannelNameFlag = val; }

    get tempChannelTimeout() { return this._tempChannelTimeout; }
    set tempChannelTimeout(val) { this._dirty = true; this._tempChannelTimeout = val; }

    get exemptAutoCreateGames() { return this._exemptAutoCreateGames; }
    set exemptAutoCreateGames(val) { this._dirty = true; this._exemptAutoCreateGames = val; }

    get autoCreateByGameRoles() { return this._autoCreateByGameRoles; }
    set autoCreateByGameRoles(val) { this._dirty = true; this._autoCreateByGameRoles = val; }

    get autoCreateByGameCommon() { return this._autoCreateByGameCommon; }
    set autoCreateByGameCommon(val) { this._dirty = true; this._autoCreateByGameCommon = val; }

    get autoCreateByGame() { return this._autoCreateByGame; }
    set autoCreateByGame(val) { this._dirty = true; this._autoCreateByGame = val; }

    get commandPrefix() { return this._commandPrefix; }
    set commandPrefix(val) { this._dirty = true; this._commandPrefix = val; }

    isDirty() { return this._dirty; }
    clean() { this._dirty = false; }

    // Return an object with all of this object's data for easy db entry
    getEntryFormat(guildID, showID) {
        var rtn = {
            guild_id: guildID,
            commandPrefix: this._commandPrefix,
            autoCreateByGame: this._autoCreateByGame,
            autoCreateByGameCommon: this._autoCreateByGameCommon,
            autoCreateByGameRoles: this._autoCreateByGameRoles,
            exemptAutoCreateGames: this._exemptAutoCreateGames,
            tempChannelTimeout: this._tempChannelTimeout,
            tempChannelNameFlag: this._tempChannelNameFlag,
            tempChannelFlagLocation: this._tempChannelFlagLocation,
            commandPermissions: this._commandPermissions,
            maxChannelsPerPerson: this._maxChannelsPerPerson,
        };
        showID = showID == undefined ? true : showID;
        if (showID) rtn._id = this._id;
        return rtn;
    }
}

class GlobalConfig {
    constructor(obj) {
        this._id = obj['_id'];
        this._dirty = false;

        this._tempChannelCheckInterval = obj['tempChannelCheckInterval'];
        this._autoReconnect = obj['autoReconnect'];
        this._autoReconnectInterval = obj['autoReconnectInterval'];
        this._configSaveInterval = obj['configSaveInterval'];
    }

    get tempChannelCheckInterval() { return this._tempChannelCheckInterval; }
    set tempChannelCheckInterval(val) { this._dirty = true; this._tempChannelCheckInterval = val; } 

    get autoReconnect() { return this._autoReconnect; }
    set autoReconnect(val) { this._dirty = true; this._autoReconnect = val; }

    get autoReconnectInterval() { return this._autoReconnectInterval; }
    set autoReconnectInterval(val) { this._autoReconnectInterval = val; }

    get configSaveInterval() { return this._configSaveInterval; }
    set configSaveInterval(val) { this._configSaveInterval= val; }

    isDirty() { return this._dirty; }
    clean() { this._dirty = false; }

    getEntryFormat() {
        return {
            tempChannelCheckInterval: this._tempChannelCheckInterval,
            autoReconnect: this._autoReconnect,
            autoReconnectInterval: this._autoReconnectInterval,
            configSaveInterval: this._configSaveInterval,
        }
    }
}


module.exports = {
    Config: Config,
    GlobalConfig: GlobalConfig,
};
