var express = require('express');
var app = express();
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var uristring = 
  process.env.MONGODB_URI || 
  'mongodb://localhost/test';

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
var classmap = {
    'Forestcraft': "妖精",
    'Swordcraft': "皇家",
    'Runecraft': "女巫",
    'Dragoncraft': "龍族",
    'Shadowcraft': "死靈",
    'Bloodcraft': "吸血鬼",
    'Havencraft': "主教",
    'Neutral': "中立"
}
var classmapr = {
    '妖精': "Forestcraft",
    '皇家': "Swordcraft",
    '女巫': "Runecraft",
    '龍族': "Dragoncraft",
    '死靈': "Shadowcraft",
    '血族': "Bloodcraft",
    '主教': "Havencraft",
    '中立': "Neutral"
}
var typemap = {
    'follower': "隨從",
    'spell': "法術",
    'amulet': "護符"
}
// var typemapr = {
//     '隨從': "follower",
//     '法術': "spell",
//     '護符': "spell"
// }
var traitmap = {
    '-': "-",
    'Officer': "士兵",
    'Commander': "指揮官",
    'Earth Sigil': "土之印"
}
var raritymap = {
    'Bronze': "銅卡",
    'Silver': "銀卡",
    'Gold': "金卡",
    'Legendary': "虹卡"
}

app.get('/', function(request, response) {
  response.render('pages/index');
});


 app.get('/test', function(req, res){
    res.render('pages/test', {  
   title: '首頁',  
   users: ['Kai', 'aYen', 'Kyousuke']  
  });
});

app.get('/card/:id', function (req, res) {
    db.collection(CARDS_COLLECTION).find({_id:req.params.id}).toArray(
        function(err, doc){
            var card = doc[0];
            res.render('pages/card',
                {
                    _id: req.params.id,
                    name: card.name_ch,
                    unevolved: card.unevolved.html_ch,
                    evolved: card.evolved,
                    rarity: raritymap[card.detail.rarity],
                    pack: card.detail.pack,
                    trait: traitmap[card.detail.trait],
                    class_: classmap[card.detail.class]
                }
            );
        }
    );
});

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

  // Initialize the app.
  var server = app.listen(app.get('port'), function () {
    var port = server.address().port;
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
                    //handleError(res, err.message, "Failed to create new card");
                }
            });
        });
        
    });

    res.send("initialized");
})

app.get('/update', function (req, res) {
    db.collection("cards_ch").find({}, function(err, doc){
        doc.forEach(function(element){
            if (element.evolved)
                db.collection("cards_ch").update({'_id':element._id}, 
                    {'$set':
                        {'evolved.html': element.evolved.skill,
                        'evolved.html_ch': element.evolved.skill_ch,
                        'unevolved.html': element.unevolved.skill,
                        'unevolved.html_ch': element.unevolved.skill_ch}
                    }
                );
            else
                db.collection("cards_ch").update({'_id':element._id}, 
                    {'$set':
                        {
                        'unevolved.html': element.unevolved.skill,
                        'unevolved.html_ch': element.unevolved.skill_ch}
                    }
                );
        });
    });


    res.send("initialized");
})


app.get('/name=:id', function (req, res) {
    db.collection(CARDS_COLLECTION).find({'name': new RegExp(req.params.id, "i")}).toArray(
        function(err, doc){
            var nfound = "No cards found for name: " + req.params.id;
            res_eng(err,doc,req, res, nfound);
        }
    );
    
})

app.get('/name_ch=:id', function (req, res) {

    db.collection(CARDS_COLLECTION).find({'name_ch': new RegExp(req.params.id, "i")}).toArray(
        function(err, doc){
            var nfound = "沒有找到卡片: " + req.params.id;
            res_ch(err,doc,req, res, nfound);
        }
    );
    
})

app.get('/cost=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "Invalid input argument. Ex: !amulet blood 566";

    var ret = parse_ch(argv, res, err_msg, true);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = new RegExp(ret.cur_cost.toString());

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'alt': cur_cost, 'detail.type': "follower"}).toArray(
        function(err, doc){
            var nfound = "No cards found for " + (argv.length==1?"":cur_class) + " " + cur_cost + "follower";
            res_eng(err,doc,req, res, nfound);
        }
    );
    
})


app.get('/cost_ch=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "指令錯誤喔 範例: !費用 血 566";

    var ret = parse_ch(argv, res, err_msg);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = new RegExp(ret.cur_cost.toString());

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'alt': cur_cost, 'detail.type': "follower"}).toArray(
        function(err, doc){
            var nfound = "沒有找到" + (argv.length==1?"":classmap[cur_class]) + cur_cost + "隨從";
            res_ch(err,doc,req, res, nfound);
        }
    );
})

app.get('/follower=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "Invalid input argument. Ex: !follower blood 5";

    var ret = parse_ch(argv, res, err_msg, true);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "follower"}).toArray(
        function(err, doc){
            var nfound = "No cards found for " + (argv.length==1?"":cur_class) + " " + cur_cost + "pp follower";
            res_eng(err,doc,req, res, nfound);
        }
    );
    
})

app.get('/follower_ch=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "指令錯誤喔 範例: !隨從 血 5";

    var ret = parse_ch(argv, res, err_msg);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "follower"}).toArray(
        function(err, doc){
            var nfound = "沒有找到" + (argv.length==1?"":classmap[cur_class]) + cur_cost + "pp隨從";
            res_ch(err,doc,req, res, nfound);
        }
    );
})

app.get('/amulet=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "Invalid input argument. Ex: !amulet sword 3";

    var ret = parse_ch(argv, res, err_msg, true);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "amulet"}).toArray(
        function(err, doc){
            var nfound = "No cards found for " + (argv.length==1?"":cur_class) + " " + cur_cost + "pp amulet";
            res_eng(err,doc,req, res, nfound);
        }
    );
    
})

app.get('/amulet_ch=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "指令錯誤喔 範例: !法術 皇 3";

    var ret = parse_ch(argv, res, err_msg);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "amulet"}).toArray(
        function(err, doc){
            var nfound = "沒有找到" + (argv.length==1?"":classmap[cur_class]) + cur_cost + "pp護符";
            res_ch(err,doc,req, res, nfound);
        }
    );
})

app.get('/spell=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "Invalid input argument. Ex: !spell Fore 6, !spell sword 5";

    var ret = parse_ch(argv, res, err_msg, true);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "spell"}).toArray(
        function(err, doc){
            var nfound = "No cards found for " + (argv.length==1?"":cur_class) + " " + cur_cost + "pp spell";
            res_eng(err,doc,req, res, nfound);
        }
    );
    
})
app.get('/spell_ch=:id', function (req, res) {
    var argv = req.params.id.split(" ");
    var cur_class = "", cur_cost;
    var err_msg = "指令錯誤喔 範例: !法術 妖 6, !法術 皇家 5";

    var ret = parse_ch(argv, res, err_msg);
    if (ret == -1)
        return;
    cur_class = ret.cur_class;
    cur_cost = ret.cur_cost;

    db.collection(CARDS_COLLECTION).find({'detail.class': cur_class,'detail.cost': cur_cost, 'detail.type': "spell"}).toArray(
        function(err, doc){
            var nfound = "沒有找到" + (argv.length==1?"":classmap[cur_class]) + cur_cost + "pp法術";
            res_ch(err,doc,req, res, nfound);
        }
    );
})

function parse_ch(argv, res, err_msg, eng){
    var cur_class="", cur_cost;
    if (argv.length == 2){
            var regex = new RegExp(argv[0], "i");
            if(!eng){
                for(var key in classmapr){
                    if(regex.test(key))
                        cur_class = classmapr[key];
                }
            }
            else{
                for(var key in classmap){
                    if(regex.test(key))
                        cur_class = key;
                }
            }
            if(cur_class == ""){
                res.send(err_msg);
                return -1;
            }
            cur_cost = Number(argv[1]);
        }
        else if (argv.length == 1){
            cur_class = RegExp("");
            cur_cost = Number(argv[0]);
            if(isNaN(cur_cost)){
                res.send(err_msg);
                return -1;
            }

        }
        else if (argv.length > 2 || argv.length == 0){
            res.send(err_msg);
            return -1;
    }
    return {
        cur_class: cur_class,
        cur_cost: cur_cost
    };
}

function res_eng(err, doc, req, res, nfound){
    if(err) {
        return console.log('err:'+err);
    }
    if(doc.length == 0){
        res.send(nfound);
    }
    else{
        if(doc.length==1){
            card = doc[0];
            var str = "";
            str += card.name + ", ";
            str += card.detail.class + " ";
            str += card.detail.cost + "pp " + card.detail.rarity + " " + card.detail.type;
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
}


function res_ch(err, doc, req, res, nfound){
    if(err) {
        return console.log('err:'+err);
    }
    if(doc.length == 0){
        res.send(nfound);
    }
    else{
        if(doc.length==1){
            card = doc[0];
            var str = "";
            str += card.name_ch + ", ";
            str += classmap[card.detail.class] + " ";
            str += card.detail.cost + "pp " + raritymap[card.detail.rarity] + typemap[card.detail.type];
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
}

app.get('/roll', function (req, res) {
    var str = "", got = 0;
    str += "轉出了:     | ";
    var perm = getRandomPerm(1,9,4), counter = 0;
    
    

    for(var i = 0; i < 4; ++i){
        db.collection(CARDS_COLLECTION).aggregate(
            [  
            { 
                $match: {
                    'detail.type': "follower", 
                    'detail.class': 'Shadowcraft',
                    'detail.cost': perm[i],
                    '_id': {$ne:"103541010"}
                } 
            },
            { $sample: { size: 1 } } ]
        ).toArray(function(err, doc){
            str += doc[0].name_ch + "(" + doc[0].detail.cost + ")" + " | ";
            if(doc[0]._id == "101531050"){
                got = 1;
            }
            complete();
        });
    }

    var complete = function(){
        if (counter != 3){
            ++counter;
            return;
        }
        if(got == 1){
            str += "      恭喜中大獎 ゜ω゜)っ";
        }
        else if(got == 0){
            str += "      什麼都沒中 只有轉蛋姬陪你 (;´༎ຶД༎ຶ`)";
        }
        res.send(str);
    }
    

})


app.get('/rolls', function (req, res) {
    var str = "", got = 0, got2 = 0;
    str += "轉出了:     | ";
    var perm = getRandomPerm(1,8,4);
    
    var rollmap = {
        1: ["骷髏獸(112)"],
        2: ["踉蹌的不死者(212)","獨角舞者・優尼子(222)",],
        3: ["暗之從者(311)", "霸食帝・凱薩霸(322)", "地底士兵(314)"],
        4: ["烏爾德(433)", "死靈刺客(433)"],
        5: ["可魯(533)"],
        6: ["冥守的戰士・卡姆拉(745)"],
        7: ["決鬥者・莫迪凱(855)"]
    }

    for(var i = 0; i < 4; ++i){
        if(perm[i] == 7)
            got = 1;
        // if(perm[i] == 6)
        //     got2 = 1;
        var l = rollmap[perm[i]].length;
        var r = getRandomInt(0,l);
        if(perm[i] == 3 && r == 0)
            got2 =1;

        str += rollmap[perm[i]][r] + " | ";
    }

    if(got == 1){
        str += "      恭喜中大獎 855一隻 ゜ω゜)っ";
    }
    else if(got == 0){
        //if (got2 ==1){
        //    //str += "      二獎冥守奶一波 ヽ(́◕◞౪◟◕‵)ﾉ";
        //}
        //else
        if (got2 ==1){
           str += "      安慰獎444巫妖 (ㄏ￣▽￣)ㄏ ㄟ(￣▽￣ㄟ)";
        }
        else
            str += "      什麼都沒中 只有轉蛋姬陪你 (;´༎ຶД༎ຶ`)";
    }
    res.send(str);
    

})

function getRandomPerm(min, max, n) {
    var array = [];
    for(var i = 0; i < n; ++i){
        var r = getRandomInt(min, max);
        if (array.indexOf(r) > -1){
            --i;
        }
        else{
            array.push(r);
        }
    }

    return array;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
