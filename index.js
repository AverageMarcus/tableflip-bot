"use strict";
const request = require('request');
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({ port: process.env.PORT || 7000 });

const clientID = process.env.client_id;
const clientSecret = process.env.client_secret;
let teamTokens = {};

server.route({
  method: 'POST',
  path: '/tableflip',
  handler: function(req, reply) {
    let channel = req.payload.channel_id;
    let userID = req.payload.user_id;
    let teamId = req.payload.team_id;
    let usersText = req.payload.text || '';

    getUser(teamTokens[teamId], userID)
      .then((user) => postMessage(teamTokens[teamId], user, channel, `${usersText ? usersText + ' ': ''}(╯°□°)╯︵ ┻━┻`))
      .then((msg) => reply(''))
      .catch(err => {
        console.log(err);
        reply({text: 'Something went wrong', in_channel: false})
          .header('Content-Type', 'application/json');
      });
  }
});

server.route({
  method: 'GET',
  path: '/tableflip',
  handler: function(req, reply) {
    reply('');
  }
});

server.route({
  method: 'GET',
  path: '/install',
  handler: function(req, reply) {
    return reply.redirect(`https://slack.com/oauth/authorize?client_id=${clientID}&scope=chat:write:bot,users:read`);
  }
});

server.route({
  method: 'GET',
  path: '/auth',
  handler: function(req, reply) {
    request(`https://slack.com/api/oauth.access?client_id=${clientID}&client_secret=${clientSecret}&code=${req.query.code}`, function(error, response, body) {
      let token = JSON.parse(body).access_token;
      let teamID = JSON.parse(body).team_id;
      let teamName = JSON.parse(body).team_name;
      teamTokens[teamID] = token;

      return reply.redirect(`https://${teamName}.slack.com/`);
    });
  }
});

server.start((err) => {
  if (err) throw err;
  console.log('Server running at:', server.info.uri);
});

function getUser(token, username) {
  return new Promise((resolve, reject) => {
    request(`https://slack.com/api/users.list?token=${token}`, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        for(let user of JSON.parse(body).members || []) {
          if(user.id === username) {
            resolve(user);
          }
        }
        reject('User not found');
      } else {
        reject(error);
      }
    });
  });
}

function urlEncodeTag(strings, ...values) {
    let result = "";
    for(let i = 0; i < strings.length; i++){
      result += strings[i];
      if(i < values.length){
        result += encodeURIComponent(values[i]);
      }
    }
    return result;
};

function postMessage(token, user, channel, message) {
  return new Promise((resolve, reject) => {
    let url = urlEncodeTag`https://slack.com/api/chat.postMessage?token=${token}&channel=${channel}&text=${message}&username=${user.profile.real_name_normalized || user.name}&as_user=false&icon_url=${user.profile.image_512}`;
    request(url, function(error, response, body) {
      if(error) return reject(error);
      return resolve('Sent');
    });
  });
}