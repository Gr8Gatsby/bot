var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');
var path = require('path');
var fs = require('fs');


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^change name/i, [
    function(session) {
        session.beginDialog('/profile');
    },
    function(session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

// Random image
intents.matches(/\b(?:img|photo|picture|image|pic)\b/i, [
    function(session) {
        session.beginDialog('/picture');
    },
    function(session, results) {
        //session.send('How about that picture?');
    }
]);

// Find
intents.matches(/^(?=.*\bfind\b)(?=.*\bimage|img|pic|picture|photo\b)/i, [
    function(session) {
        session.beginDialog('/findImage');
    },
    function(session, results) {
        session.send('I hope that is what you want!');
    }
]);

// color
intents.matches(/\b(?:color|colour|colors|colours)\b/i, [
    function(session) {
        session.beginDialog('/color');
    },
    function(session, results) {
        session.send('here are some color palletes:')
    }
]);

intents.onDefault([
    function(session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function(session, results) {
        session.send('Hello %s!', session.userData.name);
        session.send('Ask me for a color, or an image...');
    }
]);

bot.dialog('/profile', [
    function(session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function(session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/findImage', [
    function(session) {
        // Need to support the search API for unsplash
        console.log(session);
        session.send("looking for image...")
            // need to add more options than unsplash
    },
    function(session, results) {

        session.endDialog();
    }
]);

bot.dialog('/picture', [
    function(session) {

        // Use unsplash's official API
        var unsplashClientID = process.env.UNSPLASH_CLIENT_ID;

        getRandomPhoto(200, 200, null, function(error, photo) {
            // Create a card
            var card = new builder.HeroCard(session)
                .title("Photo by " + photo.user.name)
                .subtitle('https://unsplash.com/@' + photo.user.username)
                .images([
                    builder.CardImage.create(session, photo.urls.thumb)
                ]);
            // Create message
            var msg = new builder.Message(session).attachments([card]);
            session.send(msg);

            // End session
            session.endDialog();
        });
    }
]);

bot.dialog('/color', [
    function(session) {
        // Create a card
        getColourPallete(function(error, pallete) {
            //var card = new builder.HeroCard(session)


            for (i = 0; i < 3; i++) {

                // Get all the colors
                var colors = new String();
                for (j = 0; j < pallete[i].colors.length; j++) {
                    colors += "#" + pallete[i].colors[j]
                    if (j < pallete[i].colors.length - 1) {
                        colors += ", ";
                    } else {
                        colors += " ";
                    }
                }

                var card = new builder.HeroCard(session)
                    .title(pallete[i].title)
                    .images([builder.CardImage.create(session, pallete[i].imageUrl)])
                    .text(colors + pallete[i].url)

                // Create message
                var msg = new builder.Message(session).attachments([card]);
                session.send(msg);
            }

            // End session
            session.endDialog();
        });
        //session.send(msg);
        session.endDialog();
    }
]);

// UnSplash Random Photo
function getRandomPhoto(width, height, rect, callback) {
    var params = {};

    if (width != null)
        params.w = width;

    if (height != null)
        params.h = height;

    if (rect != null)
        params.rect = rect[0] + ',' + rect[1] + ',' + rect[2] + ',' + rect[3];

    request({
            url: ('https://api.unsplash.com/' + path.join('photos/random')),
            method: 'GET',
            qs: params,
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Client-ID ' + process.env.UNSPLASH_CLIENT_ID
            }
        },
        function(err, res, body) {
            if (err) return callback(err);

            if (res.statusCode !== 200) return callback(new Error(body), null);

            return callback(null, JSON.parse(body));
        });
}

// Colourlovers.com get random color
function getColourPallete(callback) {

    request('http://www.colourlovers.com/api/palettes?format=json',
        function(err, res, body) {
            if (err) return callback(err);

            if (res.statusCode !== 200) return callback(new Error(body), null);

            return callback(null, JSON.parse(body));
        });
}