var express = require('express');
var app = express();
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

const revlo = require('node-revlobot-api')('9egaKeMFszamdYhlmxAhM3UPaT1QBmnNivJLzwhxcu8');


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

var typemapr = {
    '隨從': "follower",
    '法術': "spell",
    '護符': "amulet"
}
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
var packmap ={
    'BASIC': "基礎包",
    'STD': "標準卡包",
    'DARKNESS': "暗黑進化",
    'ROB': "巴哈姆特降臨"
}

app.get('/', function(request, response) {
  response.render('pages/index');
});


 app.get('/test', function(req, res){
    console.log(req.query);
    res.render('pages/test', {  
        title: '首頁',  
        users: ['Kai', 'aYen', 'Kyousuke'], 
        char_type: req.query.char_type
    });
});
//modify null and single to array
function preproc(array){
    var ret = [];
    if (array == null){
        return ret;
    }
    else if (array.length == 1){
        ret.push(array);
        return ret;
    }
    else
        return array;
}
function classfunc(element){
    return Object.keys(classmap)[element];
}
function packfunc(element){
    return Object.keys(packmap)[element];
}
function typefunc(element){
    return Object.keys(typemap)[element];
}
function rarityfunc(element){
    return Object.keys(raritymap)[element];
}
function costfunc(element){
    return Number(element)+1;
}


app.get('/test2', function(req, res){
    console.log(req.query.char_type);
    
    var q_class = preproc(req.query.class_).map(classfunc);
    var q_pack = preproc(req.query.pack).map(packfunc);
    var q_type = preproc(req.query.char_type).map(typefunc); //queries
    var q_rarity = preproc(req.query.rarity).map(rarityfunc);
    var q_cost = preproc(req.query.cost).map(costfunc);
    if(q_cost.indexOf(10) > -1) q_cost.push(18);
    
    //build up the final query
    var query = {};
    if(req.query.card_name){
        query['name_ch']= new RegExp(req.query.card_name, "i");
    }
    if(q_class.length != 0){
        query['detail.class']={ $in: q_class};
    }
    if(q_pack.length != 0){
        query['detail.pack']={ $in: q_pack};
    }
    if(q_type.length != 0){
        query['detail.type']={ $in: q_type};
    }
    if(q_rarity.length != 0){
        query['detail.rarity'] = { $in: q_rarity};
    }
    if(q_cost.length != 0){
        query['detail.cost'] = { $in: q_cost};
    }
    console.log(query);
    //query the db
    db.collection(CARDS_COLLECTION).find(query).toArray(
        function(err, doc){
            //console.log(doc);
            res.render('pages/test', {  
                title: '首頁',  
                users: ['Kai', 'aYen', 'Kyousuke'],
                card_name:req.query.card_name,
                class_: req.query.class_ ,
                pack: req.query.pack,
                char_type: req.query.char_type,
                rarity: req.query.rarity,
                cost: req.query.cost,
                cards:doc
            });
        }
        
    );
    
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


app.get('/api', function (req, res) {
    var arg = req.query.arg, num, name_ch, class_="", type="", example;
    var cht = req.query.cht;
    if(cht)
        example = "指令錯誤喔 範例: !卡片 566, !卡片 貞德 , !卡片 法 5, !卡片 皇 756, !卡片 龍 護符 5";
    else
        example = "Invalid input argument. Ex: !card 566, !card forte , !card rune 5, !card sword 756, !card dra amulet 5";
    //parsing...
    if(arg == "null" || arg == ""){
        if(cht)
            res.send("範例: !卡片 566, !卡片 貞德 , !卡片 法 5, !卡片 皇 756, !卡片 皇 護符 5");
        else
            res.send("Ex: !card 566, !card forte , !card rune 5, !card sword 756, !card dra amulet 5");
        return;
    }
    var argv = arg.split(" ");
    var query = {};
    var err_msg;
    if(argv.length == 1){
        num = Number(argv[0]);
        if (isNaN(num)){
            if(cht){
                query['name_ch'] = new RegExp(argv[0], "i");
                err_msg = "沒有找到卡片: "+argv[0];
            }
            else{
                query['name'] = new RegExp(argv[0], "i");
                err_msg = "No cards found for name: "+argv[0];
            }
        }
        else{
            query['alt'] = new RegExp(argv[0]);
            if(cht)
                err_msg = "沒有找到"+ num +"隨從";
            else
                err_msg = "No cards found for "+ num +" follower";
        }
    }
    else if (argv.length == 2){
        //parse num
        num = Number(argv[1]);
        var msg_num;
        if (isNaN(num)){
            res.send(example);
            return;
        }
        else{
            if(num > 100){
                query['alt'] = new RegExp(argv[1]);
                msg_num = argv[1];
            }
            else {
                query['detail.cost'] = num;
                msg_num = argv[1] + "pp";
            }
        }
        //parse class or type
        var regex = new RegExp(argv[0], "i");
        if(cht){
            for(var key in classmapr){
                if(regex.test(key))
                    class_ = classmapr[key];
            }
            for(var key in typemapr){
                if(regex.test(key))
                    type = typemapr[key];
            }
        }
        else{
            for(var key in classmap){
                if(regex.test(key))
                    class_ = key;
            }
            for(var key in typemap){
                if(regex.test(key))
                    type = key;
            }
        }
        //check which type of arg is the first one
        if(class_ != ""){
            query['detail.class'] = class_;
            if(cht)
                err_msg = "沒有找到"+classmap[class_]+msg_num+"卡片";
            else
                err_msg = "No cards found for "+class_+" "+msg_num+" card";
        }
        else if(type != ""){
            query['detail.type'] = type;
            if(cht)
                err_msg = "沒有找到"+msg_num+typemap[type];
            else
                err_msg = "No cards found for "+msg_num+" "+type;                
        }
        else{
            res.send(example);
        }
    }
    else if (argv.length == 3){
        //parse num
        num = Number(argv[2]);
        var msg_num;
        if (isNaN(num)){
            res.send(example);
            return;
        }
        else{
            if(num > 100){
                query['alt'] = new RegExp(argv[2]);
                msg_num = argv[2];
            }
            else {
                query['detail.cost'] = num;
                msg_num = argv[2] + "pp";
            }
        }
        //parse class
        var regex = new RegExp(argv[0], "i");
        if(cht){
            for(var key in classmapr){
                if(regex.test(key))
                    class_ = classmapr[key];
            }
        }
        else{
            for(var key in classmap){
                if(regex.test(key))
                    class_ = key;
            }
        }
        if(class_ != ""){
            query['detail.class'] = class_;
        }
        else{
            res.send(example);
        }
        //parse type
        regex = new RegExp(argv[1], "i");
        if(cht){
            for(var key in typemapr){
                if(regex.test(key))
                    type = typemapr[key];
            }
        }
        else{
            for(var key in typemap){
                if(regex.test(key))
                    type = key;
            }
        }
        if(type != ""){
            query['detail.type'] = type;
        }
        else{
            res.send(example);
        }

        if(cht)
            err_msg = "沒有找到"+classmap[class_]+msg_num+typemap[type];
        else
            err_msg = "No cards found for "+class_+" "+msg_num+" "+type;
    }

    db.collection(CARDS_COLLECTION).find(query).toArray(
        function(err, doc){
            if(cht)
                res_ch(err,doc,req, res, err_msg);
            else
                res_eng(err,doc,req, res, err_msg);
        }
    );
    
})


function res_eng(err, doc, req, res, nfound){
    if(err) {
        return console.log('err:'+err);
    }
    if(doc.length == 0){
        res.send(nfound);
        return;
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
            return;

        }
        else{
            var str = "Multiple matches: | "
            doc.forEach(function(card){
                str += card.name + " | ";
            });
            res.send(str);
            return;
        }
        
    }
}


function res_ch(err, doc, req, res, nfound){
    if(err) {
        return console.log('err:'+err);
    }
    if(doc.length == 0){
        res.send(nfound);
        return;
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
            return;
        }
        else{
            var str = "多項符合: | "
            doc.forEach(function(card){
                str += card.name_ch + " | ";
            });
            res.send(str);
            return;
        }
        
    }
}

app.get('/rolls', function (req, res) {
    var user = req.query.u.toLowerCase();
    revlo.get.points(user).then(data => {
        var mypoint = data.loyalty.current_points;
        if(mypoint < 10)
            res.send(user + " 沒錢先挖礦 再來玩轉蛋姬 ლↂ‿‿ↂლ");
        else{
            //roll
            var str = "", got = 0, got2 = 0;
            str += user + " 花10個麵包轉出了:     | ";
            //var perm = getRandomPerm(1,8,4);
            var perm = shuffle([1,2,3,4,5,6,7]);
            var bonus = 0;
            
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
                str += "      恭喜中大獎 855一隻 ゜ω゜)っ 獲得14個麵包";
                bonus = 14-10;
            }
            else if(got == 0){
                //if (got2 ==1){
                //    //str += "      二獎冥守奶一波 ヽ(́◕◞౪◟◕‵)ﾉ";
                //}
                //else
                if (got2 ==1){
                   str += "      安慰獎444巫妖 (ㄏ￣▽￣)ㄏ ㄟ(￣▽￣ㄟ) 獲得7個麵包";
                   //bonus = 7-10;
                }
                else{
                    str += "      什麼都沒中 只有轉蛋姬陪你 (;´༎ຶД༎ຶ`)";
                    bonus = 0-10;
                }
            }
            //send
            revlo.post.bonus(user, {
                amount: bonus,
            }).then(data => {
                res.send(str);
            }, console.error);
        }
    }, console.error);    

})

function shuffle(array) {
    var i = array.length,
        j = 0,
        temp;
    while (i--) {
        j = Math.floor(Math.random() * (i+1));
        // swap randomly chosen element with current element
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


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

 
function revlocommands(req, res, num, msg, err_msg){
    var sender = req.query.s.toLowerCase(), receiver = req.query.r.toLowerCase();
    if (receiver == "null")
        receiver = sender;
    revlo.get.points(receiver).then(data=> {
        revlo.get.points(sender).then(data => {
            var mypoint = data.loyalty.current_points;
            if(mypoint < num)
                res.send(sender + err_msg);
            else{
                revlo.post.bonus(sender, {
                    amount: -1*num,
                }).then(data => {
                    revlo.post.bonus(receiver, {
                        amount: num,
                    }).then(data => {
                        res.send(sender +" 花"+ num +"送給 " + receiver + msg);
                    }, console.error);
                }, console.error);
            }
        }, console.error);
    }, function(err){ res.send("你找錯了 這裡沒有 " + receiver + " 這個人啦 ಠ_ಠ")} );

}

app.get('/revlo', function (req, res) {
    if(req.query.c == "combo"){
        revlocommands(req,res, 87," 一份87套餐 GivePLZ DoritosChip AMPTropPunch  ( ・・)つ―{}@{}@{}- ", " 沒錢不要買套餐啦 ◔\"L__◔");
    }
    else if(req.query.c == "chicken"){
        revlocommands(req,res, 50," 其實你想要的，是雞肉對吧？ ( ・・)つ―{}@{}@{}- ", " 沒錢不要買雞肉串啦 （╯－＿－）╯╧╧");
    }
    else if(req.query.c == "doritos"){
        revlocommands(req,res, 10," 一包薯片 GivePLZ DoritosChip ", " 沒錢不要買 DoritosChip 啦 （｀_ゝ´)");
    }
    else if(req.query.c == "beer"){
        revlocommands(req,res, 30," 一罐啤酒 GivePLZ AMPTropPunch ", " 沒錢去當礦工啦 (╬ಠ益ಠ)");
    }
    else if(req.query.c == "cure"){
        revlocommands(req,res, 168," 醫療包 GivePLZ ✚ 請別放棄治療 ", " 沒錢先治療自己好爆 FailFish");
    }
})
app.get('/revlo_transfer', function (req, res) {
    var sender = req.query.s, arg = req.query.arg.toLowerCase();
    var example = " 範例: !轉帳 shanasaikou 87";
    //split and check input
    if (arg == "null"){
        res.send("沒輸東西是要轉什麼啦 (╬ಠ益ಠ)" + example); 
        return;
    }
    var argv = arg.split(" ");
    var receiver, num;
    if (argv.length == 1){
        receiver = sender;
        num = Number(argv[0]);
    }
    else if (argv.length == 2){
        receiver = argv[0];
        num = Number(argv[1]);
    }
    else{
        res.send("大大你指令輸錯了 FailFish" + example); 
        return;
    }
    if(isNaN(num)){
        res.send("大大你輸錯了 FailFish" + example);
        return;
    }
    //send
    revlo.get.points(receiver).then(data=> {
        revlo.get.points(sender).then(data => {
            var mypoint = data.loyalty.current_points;
            if(mypoint < num)
                res.send(sender + "沒錢先挖礦好爆 還想轉錢給別人 BrokeBack");
            else{
                revlo.post.bonus(sender, {
                    amount: -1*num,
                }).then(data => {
                    revlo.post.bonus(receiver, {
                        amount: num,
                    }).then(data => {
                        res.send(sender +" 轉"+ num +"給 " + receiver + " VoHiYo");
                    }, console.error);
                }, console.error);
            }
        }, console.error);
    }, function(err){ res.send("你找錯了 這裡沒有 " + receiver + " 這個人啦 ಠ_ಠ")} );


})

app.get('/gamble', function (req, res) {
    var user = req.query.user.toLowerCase();
    var num = Number(req.query.bet);
    var ante = Number(req.query.ante);
    if(isNaN(num)){
        res.send(user+" :要賭不要輸錯數字啦 (╬ಠ益ಠ)"); 
        return;
    }
    if(num < 0){
        res.send(user+" :賭負的麵包 你4不4有什麼企圖 ಠ_ಠ"); 
        return;
    }
    else if(num < ante){
        res.send(user+" :底注是"+ante+"個麵包喔 VoHiYo");
    }
    revlo.get.points(user).then(data => {
        var mypoint = data.loyalty.current_points;
        if(mypoint < num)
            res.send(user + " :沒錢先挖礦 再來賭博好爆 Kappa");
        else{
            //roll
            var str = user, bonus;
            var roll = getRandomInt(1,101);
            str += " 骰出 " + roll + "，";

            if(roll <= 60){
                str += num + "個麵包掉到地上了 (;´༎ຶД༎ຶ`)";
                if(roll == 1)
                    str += "。原來你是地選之人 StoneLightning ";
                bonus = -1*num;
            }
            else if(roll <= 98){
                str += "挖到"+num*2+"個麵包 (ﾉ>ω<)ﾉ";
                bonus = num;
            }
            else{
                str += "挖到"+num*10+"個麵包。天選之人4你 ╮(′～‵〞)╭";
                bonus = num*9;
            }
            var total = mypoint + bonus;
            str += " 現在有"+ total +"個麵包";
            //send
            revlo.post.bonus(user, {
                amount: bonus,
            }).then(data => {
                res.send(str);
            }, console.error);
        }
    }, console.error);    

})

app.get('/assemble', function(req, res){
    var sender = req.query.sender, arg = req.query.arg, receiver;
    //split and check input
    if (arg == "null"){
        receiver = sender;
    }
    else{
        var argv = arg.split(" ");
        if (argv.length == 1){
            receiver = argv[0];
        }
        else if (argv.length >= 2){
            sender = argv[0];
            receiver = argv[1];
        }
    }

    //crypto func
    var crypto;
    try {
      crypto = require('crypto');
    } catch (err) {
      console.log('crypto support is disabled!');
    }
    function getHashInt(person, M){
        const secret = '0';
        const hash = crypto.createHmac('sha256', secret).update(person).digest('hex');
        var n = parseInt(hash.substring(60),16);
        return n%M;
    }
    // get the assemble percentage
    var h1 = getHashInt(sender,100), h2 = getHashInt(receiver,100);
    var a = h1-h2;
    if(a < 0) a *= -1;
    a = 100 - a;
    //rigged
    if(a == 77)
        a = 87;
    else if(a == 87)
        a = 77;


    //post process
    var str = "";
    str += sender + " 跟 " + receiver + " 有" + a + "%像 ";
    if(a > 87)
        str += "KappaPride KappaPride KappaPride";
    else if (a > 50)
        str += " GivePLZ TakeNRG";
    else if (a > 25)
        str += " 恩...不太像 FailFish";
    else 
        str += " 完全不像 BibleThump";
    res.send(str);
})


app.get('/look', function (req, res) {
    var str = [
                'acs142',
                '爐心',
                'ss',
                'Erickraz',
                '黑430',
                'noahsET',
                'Akh1283954',
                'Moobot',
                'revlobot'
                ];
    res.send(str[getRandomInt(0,str.length)]);
})

app.get('/open', function(req, res){

    //var b=0, s=0, g=0, l=0;
    var sender = req.query.sender;
    var str = sender + " 開出: | ";
    for(var i = 0; i < 8; ++i){
        var r = getRandomInt(0,1000);
        var animated = getRandomInt(0,25);
        if(animated < 2)
            str += "閃";

        if(r < 675){
            if(i == 8)
                str += "銀"
            else
                str += "銅"
        }
        else if(r < 925){
            str += "銀"
        }
        else if(r < 985){
            str += "金"
        }
        else{
            str += "虹"
        }

        str += " | "
    }
    str += " TakeNRG";
    res.send(str);
})
