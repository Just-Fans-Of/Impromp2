
module.exports = {
    commandPrefix: '$',

    autoCreateByGame: true,
    autoCreateByGameCommon: 1,
    autoCreateByGameRoles: "Goon Squad, Goons", // Comma-delimeted list of user's games to watch for

    tempChannelCheckInterval: 1000,
    tempChannelTimeout: 30000, // How long a channel must be empty before deleted
    tempChannelHaveName: false,
    tempChannelNamePrefix: 'Temporary:',

    autoReconnect: true,
    autoReconnectInterval: 5000,

    maxChannelsPerPerson: 4, // @TODO
};


