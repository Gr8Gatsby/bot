var builder = require('botbuilder');
var restify = require('restify');

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

        function xhrProgress(evt) {
            session.send( (evt.loaded/evt.total) * 100 + "% loaded" );
        }
        function xhrComplete(evt) {
            /*
            var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "https://unsplash.it/200/200/?random"
            }]);
            */
            session.send(evt.response);
            session.endDialog(msg);
        }
        function xhrFailed(evt) {
            session.send("I couldn't find you an image :(");
            session.endDialog();
        }
        function xhrCanceled(evt) {
            session.send("I couldn't find you an image :(");
            session.endDialog();
        }
        
        session.send("I'm finding a picture for you...");

        var xhr = new XMLHttpRequest();

        xhr.addEventListener("progress", xhrProgress);
        xhr.addEventListener("load", xhrComplete);
        xhr.addEventListener("error", xhrFailed);
        xhr.addEventListener("abort", xhrCanceled);

        xhr.open("GET", "https://unsplash.it/200/200/?random", true);
        xhr.send();
        
    }
]);