![Impromp2 Logo](/img/Imp.png)

# Impromp2 : A Discord bot for making Temporary Channels

[![start with why](https://img.shields.io/badge/see-more-brightgreen.svg?style=flat)](www.justfansof.com) [![start with why](https://img.shields.io/badge/license-MIT-red.svg?style=flat)](https://raw.githubusercontent.com/lkzhao/Hero/master/LICENSE) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/Just-Fans-Of/Impromp2/issues)

## But why?

Discord channels can get very messy very quickly. With the inability to categorize properly and with the vast amount of games out right now it is very easy to find yourself with 25 different channels that get used rarely.

Impromp2 allows you to type a simple chat command and instantly create a temporary channel that only exists as long as it has had recent activity. Feeling even lazier? Impromp2 will also automatically create a temporary voice channel when a certain amount of people are all playing the same game at the same time.

## Who is it for?

* Those who love Discord but hate that it doesn't have the same temporary channel functionality as Curse.
* Streamers / Server Managers / Moderators / People with commitment Issues / Anybody who uses Discord

## Config
```
Usage: /config [action] [key] [value]

Actions:  get, set, add, remove

  * Array properties require add or remove

Keys:

  - commandPrefix [String]: The character used to denote a command. Typically /, !, or $. Default: /

  - autoCreateByGame [true/false]: Whether to create channels when enough people are playing the same game. Default: true

  - autoCreateByGameCommon [Integer]: Minimum # of people playing the same game before creating a channel. Default: 4

  - autoCreateByGameRoles [Array<Role Name>]: Limit the detected people for game-channel creation to specific roles

  - exemptAutoCreateGames [Array<String>]: List of game names that I won't create channels for automatically

  - tempChannelTimeout [Integer]: Number of seconds to wait before deleting an empty temporary channel. Default: 30

  - tempChannelNameFlag [String]: What to add to a temporary channel name to signify it is temporary. Default: :bomb:

  - tempChannelFlagLocation [String]: Where to put the flag, either start or end. Default: end

  - permission.create [Array<Role Name>]: Who can run the create command. Administrators always can.

  - permission.config [Array<Role Name>]: Who can run the config command. Administrators always can.

Examples:

  - /config set autoCreateByGame false

  - /config get tempChannelNameFlag

  - /config add permissions.create SuperAdministratorSquad
```

  
## Installation

### Click the banner below to install to your Discord server.

<a href="http://google.com.au/" rel="some text">![Discord Logo](/img/Black.png)]</a>

### To start your own instance of Impromp2

Make a file called keys.js with your token.

``` javascript
module.exports = {
    discord: 'your-discord-token',
};
```

