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
function getTag(title){

  return '#'+title.toLowerCase().replace(/ /g,'');
}
function addToWypok(newSubtitles){
  if(newSubtitles.length==0){
    return;
  }
  /* Wydaliśmy nowe napisy do:
Person of Interest - nowe napisy do odcinka: 05x09 Sotto Voce (tak jak jest)

#grupahatak #napisy #hatakbot
*/
  var entry = `Wydaliśmy nowe napisy do: \n`;
  for(var i in newSubtitles){
    entry+=`${newSubtitles[i].title[0]} - [${newSubtitles[i].description[0]}](${newSubtitles[i].link[0]}) \n`;
  }
  entry+='\n#grupahatak #napisy #hatakbot';
  wykop.request('Entries', 'Add', {post: {body: entry}}, (err, response)=>{
      if(err) throw err;
      console.log(response);
      updateLast(new Date(result.rss.channel[0].lastBuildDate));
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
wykop.login(config.connection).then(getLastUpdate());
