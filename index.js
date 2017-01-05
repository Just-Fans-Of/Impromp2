'use strict';

var keys = require('./keys.js');
var config = require('./config.js');

exports.keys = keys;

process.title = "justfansofbot";
if(process.argv.filter(c => c == '-s' || c == '--silent').length > 0) {
    console.log = () => {}; // @TODO proper logging
}

var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://' + keys.mongo.user + ':' + keys.mongo.pwd + '@' + keys.mongo.url + ':' + keys.mongo.port + '/' + keys.mongo.db;
var bot;
var dbStore;

var c = require('./configs.js');
var Config = c.Config;
var GlobalConfig = c.GlobalConfig;

var configCollection;
var globalCollection;
// Connect to database
MongoClient.connect(url, (err, db) => {
    if (err) {
        console.error("Error connecting to DB:", err);
        return;
    }
    dbStore = db;

    console.log("Connected to database");

    //probably should use promises...
    var configDone = false;
    var globalDone = false;
    var startBot = function() {
        if (configDone && globalDone)
            bot = require('./bot.js');
    };

    db.collection('Config', (err, res) => {
    
        configCollection = res;
 
        // Setup config operations
        exports.config = {

            entries: {},

            // Send all changed configurations to server
            save: (callback) => {
                callback();
            },
            
            // Pull all config options and store locally
            pull: (callback) => {
                configCollection.find({}).toArray((err, res) => {
                    if (err) {
                        console.error("Error pulling from DB:", err);
                        callback(err);
                        return;
                    }

                    res.forEach( entry => {
                        exports.config.entries[entry.guild_id] = new Config(entry);
                    });
                    console.log(exports.config);
                    callback();
                });
            },

            // Create a new server entry
            createNew: (guildId) => {
                var copy = new Config(exports.config.entries.Default.getEntryFormat(guildId, false), true);
                exports.config.entries[guildId] = copy;
                
                configCollection.insert([copy.getEntryFormat(guildId, false)], (err, res) => {
                    if (err)
                        console.error('Error insertnig new server config:', err);
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
                console.error("Error fetching global config:", err);
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
    console.log(options.evt, "Shutting down...");
    if (err) console.log(err.stack);
    if (bot) bot.disconnect();
    if (dbStore) {
        exports.config.save((err) => {
            if(!err) console.log("Final save complete.");

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
