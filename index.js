var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var { Client, Wykop } = require('wypokjs');
var config = require('./config.js');
var wykop = new Wykop({ appkey: config.appkey, secret: config.secret });
var client = new Client(wykop, { username: 'sokytsinolop', accountkey: config.connection, userkey: 'letmeloginonmyown' });

function getNewSubtitles(since, cb) {
  request('http://grupahatak.pl/rss/', (error, response, body) => {
    var newSubtitles = [];
    if (!error && response.statusCode == 200) {
      xml2js.parseString(body, function (err, result) {
        if (err) throw err;
        for (var i in result.rss.channel[0].item) {
          if (new Date(result.rss.channel[0].item[i].pubDate) > since) {
            newSubtitles.push(result.rss.channel[0].item[i]);
          }
        }
        return cb(newSubtitles);
      });
    }
  });
}
function getTags(title) {
  var tag = '#' + title.toLowerCase().replace(/\W/g, '');
  var tags = [tag, tag + 'napisy'];
  return tags;
}
function addToWypok(newSubtitles) {
  if (newSubtitles.length == 0) {
    return;
  }
  var entry = `Wydaliśmy nowe napisy do: \n`;
  for (var i in newSubtitles) {
    var tags = getTags(newSubtitles[i].title[0]);
    entry += `${newSubtitles[i].title[0]} - [${newSubtitles[i].description[0]}](${newSubtitles[i].link[0]})\n${tags.join(' ')}\n`;
  }
  entry += '\n#grupahatak #napisy #hatakbot';
  client.request('entries/add', { postParams: { body: entry } }).then(response => {
    updateLast(new Date(newSubtitles[0].pubDate[0]));
  }).catch(err => {
    throw err
  })
}
function getLastUpdate() {
  fs.readFile(__dirname + '/last.txt', function (err, data) {
    if (err) throw err;
    getNewSubtitles(new Date(data.toString()), addToWypok);
  });
}
function updateLast(lastUpdateTime) {
  fs.writeFile(__dirname + '/last.txt', new Date(lastUpdateTime), function (err) {
    if (err) throw err;
  });
}
client.getUserKey().then((res) => {
  getLastUpdate();
});
