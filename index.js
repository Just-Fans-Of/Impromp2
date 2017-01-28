'use strict';

var winston = require('winston');

winston.level = "debug";

var keys = require('./keys.js');
var config = require('./config.js');

exports.keys = keys;

process.title = "justfansofbot";
if(process.argv.filter(c => c == '-s' || c == '--silent').length > 0) {
    winston.remove(winston.transports.Console);
}
var filt;
if((filt = process.argv.filter(c => c.startsWith("--logfile="))).length > 0) {
    var filename = filt[0].substring(filt[0].indexOf('=')+1);
    winston.add(winston.transports.File, {filename:filename});
}

var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://' + keys.mongo.user + ':' + keys.mongo.pwd + '@' + keys.mongo.url + ':' + keys.mongo.port + '/' + keys.mongo.db;
var bot;
var dbStore;

var c = require('./config.js');
var Config = c.Config;
var GlobalConfig = c.GlobalConfig;

var configCollection;
var globalCollection;

var saveInterval;

// Connect to database
MongoClient.connect(url, (err, db) => {
    if (err) {
        winston.error("Error connecting to DB:", err);
        return;
    }
    dbStore = db;

    winston.info("Connected to database");

    //probably should use promises...
    var configDone = false;
    var globalDone = false;
    var startBot = function() {
        if (configDone && globalDone) {
            bot = require('./bot.js');
            saveInterval = setInterval(exports.config.save, exports.config.global.configSaveInterval);
        }

    };

    db.collection('Config', (err, res) => {
    
        configCollection = res;
 
        // Setup config operations
        exports.config = {

            entries: {},

            // Send all changed configurations to server
            save: () => {
                if (exports.config.global.isDirty()) {
                    globalCollection.update({ _id: exports.config.global._id }, { $set: exports.config.global.getEntryFormat() });
                    exports.config.global.clean();
                }
                Object.keys(exports.config.entries).forEach(gid => {
                    var entry = exports.config.entries[gid];
                    if (entry.isDirty()) {
                        configCollection.update({ _id: entry._id}, {$set: entry.getEntryFormat(gid)});
                        entry.clean();
                    }
                });
            },
            
            // Pull all config options and store locally
            pull: (callback) => {
                configCollection.find({}).toArray((err, res) => {
                    if (err) {
                        winston.error("Error pulling from DB:", err);
                        callback(err);
                        return;
                    }

                    res.forEach( entry => {
                        exports.config.entries[entry.guild_id] = new Config(entry);
                    });
                    callback();
                });
            },

            // Create a new server entry
            createNew: (guildId, name) => {
                var copy = new Config(exports.config.entries.Default.getEntryFormat(guildId, false), true);
                exports.config.entries[guildId] = copy;

                var obj = copy.getEntryFormat(guildId, false);
                obj.name = name; // This will never update and probalby never needs to
                
                configCollection.insert([obj], (err, res) => {
                    if (err)
                        winston.error('Error inserting new server config:', err);
                })
            },

            // Saves one server's config
            updateOne: (callback) => {
                callback();
            },
        };

        // Fetch all config options and store in config
        
        exports.config.pull((err) => {
            if (!err) {
                configDone = true;
                startBot();
            }
        });
    });

    

    db.collection('Globals', (err, res) => {

        globalCollection = res;
        res.findOne((err, res) => {
            if (err) {
                winston.error("Error fetching global config:", err);
                return;
            }
            exports.config.global = new GlobalConfig(res);
            globalDone = true;
            startBot();
        });
    });
});



// Cleanup
function exitHandler(options, err) {
    winston.info(options.evt, "Shutting down...");
    if (err) winston.info(err.stack);
    if (bot) bot.disconnect();
    if (dbStore) {
        setTimeout(() => process.exit(), 4000);
        exports.config.save((err) => {
            if(!err) winston.info("Final save complete.");

            dbStore.close();

            if(options.exit) process.exit();
        });
    }
    else if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true, evt:'exit'})); process.on('SIGTERM', exitHandler.bind(null, {exit:true, evt:'SIGTERM'}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true, evt:'SIGINT'}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true, evt:'exception'}));


// Readline stuff for debugging
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
  var lower = line.toLowerCase();
  var split = line.split(' ');
  if (lower.startsWith('dumpgames')) {
    var server = split.slice(1).join(' ');
    var servFilt = Object.keys(bot.servers).filter( id => bot.servers[id].name == server);
    if (servFilt.length == 0) console.log('Server not found');
    else {
      console.log('Game output:');
      var serverID = servFilt[0];
      var list = bot.listOfUsersByGames[serverID];
      Object.keys(list).forEach(gameName => {
        var userList = list[gameName].map(uid => bot.servers[serverID].members[uid].username);
        console.log('  ', gameName, '#' + list[gameName].length + ':', userList.join(', '));
      });

    }
  }

  if (lower.startsWith('dumpchannels')) {
    /*var server = split.slice(1).join(' ');
    var servFilt = Object.keys(bot.servers).filter( id => bot.servers[id].name == server);
    if (servFilt.length == 0) console.log('Server not found');
    else {
      var serverID = servFilt[0];*/

      var channels = Object.keys(bot.listOfTempChannels).map(chanID => {
        var chan = bot.channels[chanID];
        if (chan == undefined) return 'err';
        var serv = bot.servers[chan.guild_id];
        return serv.name + ' | ' + chan.name + ': ' + bot.listOfTempChannels[chanID]
      });
      console.log('Channels: ');
      console.log('  ' + channels.join('\n  '));
    //}
  }
});
