![Impromp2 Logo](/img/Imp.png)

# Impromp2 : A Discord bot for making Temporary Channels

[![start with why](https://img.shields.io/badge/see-more-brightgreen.svg?style=flat)](http://www.justfansof.com/) [![start with why](https://img.shields.io/badge/license-MIT-red.svg?style=flat)](https://raw.githubusercontent.com/Just-Fans-Of/Impromp2/master/LICENSE) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/Just-Fans-Of/Impromp2/issues)

## But why?

Discord channels can get very messy very quickly. With the inability to categorize properly and with the vast amount of games out right now it is very easy to find yourself with 25 different channels that get used rarely.

Impromp2 allows you to type a simple chat command and instantly create a temporary channel that only exists as long as it has had recent activity. Feeling even lazier? Impromp2 will also automatically create a temporary voice channel when a certain amount of people are all playing the same game at the same time.

## Who is it for?

* Those who love Discord but hate that it doesn't have the same temporary channel functionality as Curse.
* Streamers / Server Managers / Moderators / People with commitment Issues / Anybody who uses Discord

## How do I use it?
After first being invited to a server, Impromp2 will allow anyone with a role that grants them Administrative permission to run the `/config` command, which will let you setup all the configuration properties. The defaults are pretty good, but you may want to allow a few more roles to use the `/create` command by running `/config add permission.create The Cool People Role`  

The `/create` command creates a temporary voice channel that will automatically be deleted after 30 seconds of being empty.
The bot is also configured to automatically create channels when 4 people are playing the same game.
  
## Installation

### Click the banner below to install to your Discord server.

<a href="https://discordapp.com/oauth2/authorize?client_id=266621038031273984&scope=bot&permissions=66584" rel="Add to Discord">![Discord Logo](/img/Purple.png)</a>

## To start your own instance of Impromp2

If you feel like hosting your own instance of this bot, running it requires only 3 things:
 - A discord bot user token, which you can obtain by making an application [here] and creating a bot user for that application.
 - A mongo server with 2 collections and 1 document pre-made each, [Config](https://gist.github.com/NumbuhFour/1c4636c5daa2ae292ebd9ab75dbeff31) and [Global](https://gist.github.com/NumbuhFour/4cca4ca2d78c99cb67dc0c6720d94594).
 - a keys.js file to contain the secret login/token information


``` javascript
/**** keys.js ****/

module.exports = {
    discord: 'your discord bot user token',
    mongo: {
        url: 'localhost',
        port: 27017,
        db: 'database',
        user: 'username',
        pwd: 'password',
    }
};
```
## Commands

#### Config
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

#### Create
```
Usage: /config [name]
Creates a temporary channel with the given name.
If no name is given, the channel's name will either be the title of the game you are playing, or your name if you are not.
```

