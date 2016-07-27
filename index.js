var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var Wykop = require('wykop-es6');
var config = require('./config.js');
var wykop = new Wykop(config.appkey, config.secret);
function getNewSubtitles(since, cb){
  request('http://grupahatak.pl/rss/', (error, response, body)=>{
    var newSubtitles = [];
    if (!error && response.statusCode == 200) {
      xml2js.parseString(body, function(err, result){
        if(err)throw err;
        for(var i in result.rss.channel[0].item){
          if(new Date(result.rss.channel[0].item[i].pubDate) > since){
            newSubtitles.push(result.rss.channel[0].item[i]);
          }
        }
       return cb(newSubtitles);
      });
    }
  });
}
function getTags(title){
  var tag = '#'+title.toLowerCase().replace(/ /g,'');
  var tags = [tag, tag+'napisy'];
  return tags;
}
function addToWypok(newSubtitles){
  if(newSubtitles.length==0){
    return;
  }
  var entry = `Wydaliśmy nowe napisy do: \n`;
  for(var i in newSubtitles){
    var tags = getTags(newSubtitles[i].title[0]);
    entry+=`${newSubtitles[i].title[0]} - [${newSubtitles[i].description[0]}](${newSubtitles[i].link[0]})\n${tags.join(' ')}\n`;
  }
  entry+='\n#grupahatak #napisy #hatakbot';
  wykop.request('Entries', 'Add', {post: {body: entry}}, (err, response)=>{
      if(err){console.log(err);throw err;}
      console.log(response);
      updateLast(new Date(newSubtitles[0].pubDate[0]));
      return true;
});
}
function getLastUpdate(){
fs.readFile( __dirname + '/last.txt', function (err, data) {
  if(err)throw err;
  getNewSubtitles(new Date(data.toString()), addToWypok);
});
}
function updateLast(lastUpdateTime){
  fs.writeFile( __dirname + '/last.txt', new Date(lastUpdateTime), function(err) {
    if(err)throw err;
});
}
wykop.login(config.connection).then((res)=>{
  getLastUpdate();
});
