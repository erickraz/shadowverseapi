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

// app.get('/', function(request, response) {
//   response.render('pages/index');
// });

var db;
var USERS_COLLECTION = "PowerUsers";

mongodb.MongoClient.connect(uristring, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(app.get('port'), function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

app.get('/init', function (req, res) {
    var a = {
        "name": {
            "first": "John",
            "last": "Doe"
        },
        "age": 25
    };
    var b = {
        "name": {
            "first": "Jane",
            "last": "Doe"
        },
        "age": 65
    };
    var c = {
        "name": {
            "first": "Alice",
            "last": "Smith"
        },
        "age": 45
    };
    db.collection(USERS_COLLECTION).remove({});
    db.collection(USERS_COLLECTION).insertOne(a, function(err, doc){
        if(err){
            handleError(res, err.message, "Failed to create new contact");
        }
    });
    db.collection(USERS_COLLECTION).insertOne(b, function(err, doc){
        if(err){
            handleError(res, err.message, "Failed to create new contact");
        }
    });
    db.collection(USERS_COLLECTION).insertOne(c, function(err, doc){
        if(err){
            handleError(res, err.message, "Failed to create new contact");
        }
    });
    db.collection(USERS_COLLECTION).find({"age":25}).toArray(function(err, doc){
        console.log(doc);
    });
    
    res.send("initialized");
})

app.get('/user=:id', function (req, res) {
    //req.params.id)
    //var array = [];
    db.collection(USERS_COLLECTION).find({'name.last': new RegExp(req.params.id, "i")}).toArray(function(err, doc){
        if(err) {
            return console.log('err:'+err);
        }
        console.log(doc);
        if(doc.length == 0){
            res.send('non find');
        }
        else{
            if(doc.length==1){
                res.send(doc[0]);
            }
            else{
                var str = "matches: |"
                doc.forEach(function(record){
                    str += record.name.last + "|";
                });
                res.send(str);
            }
            
        }
    })
    
})