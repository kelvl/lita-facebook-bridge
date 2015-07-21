var login = require('facebook-chat-api');
var WebSocket = require('faye-websocket')
var http = require('http');
var Request = require('request');
var assert = require('assert')


var email = process.env.FB_LOGIN;
var password = process.env.FB_PASSWORD;
var serverPort = process.env.PORT;

assert.ok(email, "Login cannot be empty")
assert.ok(password, "Password cannot empty")
assert.ok(serverPort, "Server port cannot be empty")

var server = http.createServer();

var ws = null;
var fbApi = null

server.on('upgrade', function(request, socket, body) {
  if(WebSocket.isWebSocket(request)) {
    ws = new WebSocket(request, socket, body);

    ws.on('message', function(data, flags) {
      js = JSON.parse(data.data)

      console.log("Received incoming message", js);

      if(js.type == "message") {
        fbApi.sendMessage({'body': js.body}, parseInt(js.thread_id));
      } else if(js.type == "attachment") {
        Request(js.attachment)
          .on('response', function(response){
            if(response.statusCode == 200) {
              fbApi.sendMessage({'body': js.body, 'attachment': response}, parseInt(js.thread_id));
            }
          })
          .on('error', function(err){
            console.log("Error fetching url", js.url, err)
          });
      }

    });
  }
});

login({email: email, password: password}, function callback (err, api) {
    if(err) return console.error(err);

    api.setOptions({listenEvents: true});
    fbApi = api

    api.listen(function(err, event, stopListening) {
      if(ws) {
        ws.send(JSON.stringify(event));
      }
      if(err) return console.error(err);
      console.log(event);
      switch(event.type) {
        case "message":
          api.markAsRead(event.thread_id, function(err) {
            if(err) console.log(err);
          });
          break;
      }
    });
});

server.listen(serverPort)
