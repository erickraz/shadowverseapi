var express = require('express');
var app = express();
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var uristring = 
  process.env.MONGODB_URI || 
  'mongodb://localhost/HelloMongoose';

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
var classmap = {
    'Forestcraft': "妖精",
    'Swordcraft': "皇家",
    'Runecraft': "女巫",
    'Dragoncraft': "龍族",
    'Shadowcraft': "死靈",
    'Bloodcraft': "血族",
    'Havencraft': "主教",
    'Neutral': "中立"
}
var typemap = {
    'follower': "隨從",
    'spell': "法術",
    'amulet': "護符"
}
var traitmap = {
    'Officer': "士兵",
    'Commander': "指揮官",
    'Earth Sigil': "土之印"
}

// app.get('/', function(request, response) {
//   response.render('pages/index');
// });

var db;
var CARDS_COLLECTION = "Cards";

var fs = require('fs');

mongodb.MongoClient.connect(uristring, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  //console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(app.get('port'), function () {
    var port = server.address().port;
    //console.log("App now running on port", port);
  });
});

app.get('/init', function (req, res) {
    fs.readFile('cards.json', 'utf8', function (err, data) {
        if (err) {
            handleError(res, err.message, "Failed to load cards.json");
            return;
        }
        if(err) throw err;
        var obj = JSON.parse(data);
        db.collection(CARDS_COLLECTION).remove({});
        obj.forEach(function(element){
            db.collection(CARDS_COLLECTION).insertOne(element, function(err, doc){
                if(err){
                    handleError(res, err.message, "Failed to create new card");
                    //console.log(err);
                }
            });
        });
        
    });


    

    
    res.send("initialized");
})

app.get('/name=:id', function (req, res) {
    //req.params.id)
    //var array = [];
    db.collection(CARDS_COLLECTION).find({'name': new RegExp(req.params.id, "i")}).toArray(function(err, doc){
        if(err) {
            return console.log('err:'+err);
        }
        //console.log(doc);
        if(doc.length == 0){
            var str = "No cards found for name: " + req.params.id;
            res.send(str);
        }
        else{
            if(doc.length==1){
                card = doc[0];
                var str = "";
                str += card.name + ", ";
                str += card.detail.class + " ";
                str += card.detail.cost + "pp " + card.detail.type;
                if(card.detail.trait != "-")
                    str += ", " + card.detail.trait;
                str += "-> ";
                if(card.evolved){
                    str += "[unevolved] " + card.unevolved.atk + "/" + card.unevolved.life;
                    str += " " + card.unevolved.skill;
                    str += " [evolved] " + card.evolved.atk + "/" + card.evolved.life;
                    str += " " + card.evolved.skill;
                }
                else{
                    str += card.unevolved.skill;
                }

                res.send(str);

            }
            else{
                var str = "Multiple matches: | "
                doc.forEach(function(card){
                    str += card.name + " | ";
                });
                res.send(str);
            }
            
        }
    })
    
})

app.get('/name_ch=:id', function (req, res) {
    //req.params.id)
    //var array = [];
    db.collection(CARDS_COLLECTION).find({'name_ch': new RegExp(req.params.id, "i")}).toArray(function(err, doc){
        if(err) {
            return console.log('err:'+err);
        }
        //console.log(doc);
        if(doc.length == 0){
            var str = "沒有找到卡片: " + req.params.id;
            res.send(str);
        }
        else{
            if(doc.length==1){
                card = doc[0];
                var str = "";
                str += card.name_ch + ", ";
                str += classmap[card.detail.class] + " ";
                str += card.detail.cost + "pp " + typemap[card.detail.type];
                if(card.detail.trait != "-")
                    str += ", " + traitmap[card.detail.trait];
                str += "-> ";
                if(card.evolved){
                    str += "[進化前] " + card.unevolved.atk + "/" + card.unevolved.life;
                    str += " " + card.unevolved.skill_ch;
                    str += " [進化後] " + card.evolved.atk + "/" + card.evolved.life;
                    str += " " + card.evolved.skill_ch;
                }
                else{
                    str += card.unevolved.skill_ch;
                }

                res.send(str);

            }
            else{
                var str = "多項符合: | "
                doc.forEach(function(card){
                    str += card.name_ch + " | ";
                });
                res.send(str);
            }
            
        }
    })
    
})

app.get('/cost=:id', function (req, res) {
    //req.params.id)
    //var array = [];
    db.collection(CARDS_COLLECTION).find({'alt': new RegExp(req.params.id, "i")}).toArray(function(err, doc){
        if(err) {
            return console.log('err:'+err);
        }
        //console.log(doc);
        if(doc.length == 0){
            var str = "No cards found for cost: " + req.params.id;
            res.send(str);
        }
        else{
            if(doc.length==1){
                card = doc[0];
                var str = "";
                str += card.name + ", ";
                str += card.detail.class + " ";
                str += card.detail.cost + "pp " + card.detail.type;
                if(card.detail.trait != "-")
                    str += ", " + card.detail.trait;
                str += "-> ";
                if(card.evolved){
                    str += "[unevolved] " + card.unevolved.atk + "/" + card.unevolved.life;
                    str += " " + card.unevolved.skill;
                    str += " [evolved] " + card.evolved.atk + "/" + card.evolved.life;
                    str += " " + card.evolved.skill;
                }
                else{
                    str += card.unevolved.skill;
                }

                res.send(str);

            }
            else{
                var str = "Multiple matches: | "
                doc.forEach(function(card){
                    str += card.name + " | ";
                });
                res.send(str);
            }
            
        }
    })
    
})

app.get('/cost_ch=:id', function (req, res) {
    //req.params.id)
    //var array = [];
    db.collection(CARDS_COLLECTION).find({'alt': new RegExp(req.params.id, "i")}).toArray(function(err, doc){
        if(err) {
            return console.log('err:'+err);
        }
        //console.log(doc);
        if(doc.length == 0){
            var str = "沒有找到消耗: " + req.params.id;
            res.send(str);
        }
        else{
            if(doc.length==1){
                card = doc[0];
                var str = "";
                str += card.name_ch + ", ";
                str += classmap[card.detail.class] + " ";
                str += card.detail.cost + "pp " + typemap[card.detail.type];
                if(card.detail.trait != "-")
                    str += ", " + traitmap[card.detail.trait];
                str += "-> ";
                if(card.evolved){
                    str += "[進化前] " + card.unevolved.atk + "/" + card.unevolved.life;
                    str += " " + card.unevolved.skill_ch;
                    str += " [進化後] " + card.evolved.atk + "/" + card.evolved.life;
                    str += " " + card.evolved.skill_ch;
                }
                else{
                    str += card.unevolved.skill;
                }

                res.send(str);

            }
            else{
                var str = "多項符合: | "
                doc.forEach(function(card){
                    str += card.name_ch + " | ";
                });
                res.send(str);
            }
            
        }
    })
    
})