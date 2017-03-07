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
server.listen(process.env.port || process.env.PORT || 3978, function () {
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
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.matches(/^show picture/i, [
    function (session) {
        session.beginDialog('/picture');
    },
    function (session,results) {
        session.send('How about that picture?');
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/picture');
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/picture', [
    function (session) {

        // Use unsplash's official API
        var unsplashClientID = process.env.UNSPLASH_CLIENT_ID;
       
        getRandomPhoto(200,200,null, function(error, photo){
            // session.send("error: " + error);
            // session.send("photo:" + photo);
            // Send a greeting and show help.
            var card = new builder.HeroCard(session)
                .title("Photo by " + photo.user.name)
                .text(photo.links.portfolio)
                .images([
                    builder.CardImage.create(session, photo.urls.thumb)
                ]);
            var msg = new builder.Message(session).attachments([card]);
            session.send(msg);
            //photo.urls.thumb, photos.urls.raw, photo.user.name, photo.user.portfolio_url
            // Photo by photo.user.name, photo.user.id, photo.user.links.portfolio

            session.endDialog();
        });
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
   function(err, res, body){
      if (err) return callback(err);

      if (res.statusCode !== 200) return callback(new Error(body), null);

      return callback(null, JSON.parse(body));
   });
}