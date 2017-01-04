
var keys = require('./keys.js');
var config = require('./config.js');

exports.keys = keys;
exports.config = config;

process.title = "justfansofbot";
if(process.argv.filter(c => c == '-s' || c == '--silent').length > 0) {
    console.log = () => {}; // @TODO proper logging
}

var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://' + keys.mongo.user + ':' + keys.mongo.pwd + '@' + keys.mongo.url + ':' + keys.mongo.port + '/' + keys.mongo.db;
MongoClient.connect(url, (err, db) => {
    if (err) {
        console.error("Error connecting to DB:", err);
        return;
    }

    console.log("Connected to database");
    
    var bot = require('./bot.js');
});



// Cleanup
function exitHandler(options, err) {
    console.log(options.evt, "Shutting down...");
    if (err) console.log(err.stack);
    if (bot) bot.disconnect();
    if (options.exit) process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true, evt:'exit'}));
process.on('SIGTERM', exitHandler.bind(null, {exit:true, evt:'SIGTERM'}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true, evt:'SIGINT'}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true, evt:'exception'}));
