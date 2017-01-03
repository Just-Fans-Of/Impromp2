
module.exports = {
    commandPrefix: '$',

    autoCreateByGame: true,
    autoCreateByGameCommon: 4, // How many users have to be playing a game before it gets a channel
    autoCreateByGameRoles: ["Goon Squad","Goons"], // list of user's games to watch for
    exemptAutoCreateGames: [],

    tempChannelCheckInterval: 1000,
    tempChannelTimeout: 30000, // How long a channel must be empty before deleted
    tempChannelHaveName: false,
    tempChannelNamePrefix: 'Temporary:',

    autoReconnect: true,
    autoReconnectInterval: 5000,

    maxChannelsPerPerson: 4, // @TODO
};


