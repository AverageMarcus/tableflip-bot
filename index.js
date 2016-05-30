"use strict";
const request = require('request');
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({ port: process.env.PORT || 7000 });

const token = process.env.TOKEN;

server.route({
  method: 'POST',
  path: '/tableflip',
  handler: function (request, reply) {
    let channel = request.payload.channel_id;
    let userID = request.payload.user_id;
    let usersText = request.payload.text || '';
    getUser(userID)
      .then((user) => postMessage(user, channel, `${usersText ? usersText + ' ': ''}(╯°□°)╯︵ ┻━┻`))
      .then((msg) => reply(''))
      .catch(err => {
        reply({text: 'Something went wrong', in_channel: false})
          .header('Content-Type', 'application/json');
      });

    //reply(`${request.params.text} (╯°□°)╯︵ ┻━┻`);
  }
});

server.start((err) => {
  if (err) throw err;
  console.log('Server running at:', server.info.uri);
});



function getUser(username) {
  return new Promise((resolve, reject) => {
    request(`https://slack.com/api/users.list?token=${token}`, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        for(let user of JSON.parse(body).members) {
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

function postMessage(user, channel, message) {
  return new Promise((resolve, reject) => {
    console.log(`Posting as ${user.name}`);
    let url = urlEncodeTag`https://slack.com/api/chat.postMessage?token=${token}&channel=${channel}&text=${message}&username=${user.profile.real_name_normalized || user.name}&as_user=false&icon_url=${user.profile.image_512}`;
    request(url, function(error, response, body) {
      if(error) return reject(error);
      return resolve('Sent');
    });
  });
}