# twitter-follow

create twitter app
==================
* You must create Twitter app to obtain credentials for OAuth (https://apps.twitter.com/)
* Generate Access Token
* Copy/paste Consumer Key/Secret and Access Key/Secret to `config.js`

USAGE
=====
* Follow all followers of specific user

    `node twitter-bot.js --action=follow --screen_name=[screen_name]`

* Unfollow followers acquired from a specific follow`run.

    `node twitter-bot.js --action=unfollow --batch=[batch_id] --screen_name=[screen_name]`

    [batch_id] and [screen_name] can be taken from batch log file in `/batches`, follow-[screen_name]-[batch_id].log
