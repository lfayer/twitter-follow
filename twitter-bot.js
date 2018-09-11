// includes and initiallization
var twitter_config = require('./config.js').twitter || {};
var bot_config = require('./config.js').bot || {};
var Twit = require('twit');
var cla = require('command-line-args');
var uniqid = require('uniqid');
var https = require('https');

var fs = require('fs');
const readline = require('readline');

var request = require('request');

// Auth with Twitter token from config
var twit = new Twit({
    consumer_key: twitter_config.api_key,
    consumer_secret: twitter_config.api_secret,
    access_token: twitter_config.access_token,
    access_token_secret: twitter_config.access_token_secret
});

// Check for command line params
const commandLineArgs = require('command-line-args')
 
const optionDefinitions = [
  { name: 'action', alias: 'a', type: String },
  { name: 'screen_name', alias: 'n', type: String },
  { name: 'batch', alias: 'b', type: String },
];

const options = commandLineArgs(optionDefinitions)

if (!options.action) {
    die("Action is required (use --action): follow, unfollow");
}

// main

// Iterate through a list of user followers and follow them
if (options.action == 'follow') {

    if (!options.screen_name) {
        die("Screen name of a user is required to follow followers");
    }

    var batch_log = uniqid('follow-'+options.screen_name+"-")+'.log';

    var cursor = -1; // twitter default for first page marker

    while (cursor != 0) {
        twit.get('followers/ids', { screen_name: options.screen_name,
                                    cursor: cursor,
                                   },  function (err, data, response) {
            if (err) {
                console.log("Problem getting the list of followers:" + err);
            } else {
                follow(data.ids, 0);
                cursor = data.next_cursor; // next page
                console.log("Next page with cursor "+cursor);
            }
        });
    cursor = 0;
    }
} else {
    if (options.action == 'unfollow') {
        if (!options.batch || !options.screen_name) {
            die("Batch id and screen name are required to revert followers");
        }

        // create readline interface to read batch log line by line
        const rl = readline.createInterface({
            input: fs.createReadStream('batches/follow-'+options.screen_name+"-"+options.batch+'.log'),
            crlfDelay: Infinity
        });
 
        rl.on('line', (id) => {
             twit.post('friendships/destroy', { user_id: id }, function (err, data, response) {
                if (err) {
                    console.log("Error unfollowing " + id + ": " + err);
                } else {
                    console.log("Unfollowed " + id);
                }
            }); 
        });

        fs.readFile('batches/follow-'+options.screen_name+'-'+options.batch+'.log', 'utf8', function (err,id) {
            if (err) {
                return console.log(err);
            }
       });
    }
}

function follow(ids, index) {
    if (index == ids.length) {
        return; //breakout condition
    }

    setTimeout(function() {
        var id = ids[index];
        twit.post('friendships/create', { user_id: id }, function (err, data, response) {
            if (err) {
                console.log("Error following:" + err);
            } else {
                console.log("Followed " + id);
                // write into batch file for record
                fs.appendFile('batches/'+batch_log, id+'\n', 'utf8', function (err) {
                    if (err) return console.log(err);
              });
            }
        });
        index += 1;
        follow(ids, index); //recursuve call instead of loop to honor timeout
    }, bot_config.follow_timeout);
}


// replicating exit or die functionality
function die (errMsg) {
    if (errMsg) {
        console.error(errMsg);
    }
    process.exit(1);
}
