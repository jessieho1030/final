var url  = require('url');
var MongoClient = require('mongodb').MongoClient; 
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://songsen:songsen@ds119588.mlab.com:19588/yuk';
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();

app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.use(express.static('public'));

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('main');
	}
});


//show all restaurant
app.get('/allRestaurant',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('/login');
	} 
	else {
		read_n_print(res,{},1);
	}	
});


app.get('/delete',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('/login');
	} 
	else {
		remove(res,req, function(result){
		console.log('finish remove');
		res.status(200);
		res.redirect('/main');
		});
	}	
});

//Get register page
app.get('/register', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.render('register'); 
	}
	else{
		res.status(200);
		res.redirect('/main');	
	}
});


// done, Get login page
app.get('/login',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {


		res.status(200);
		res.render('login');

	} 
	//login already
	else {		
		res.status(200);
		res.redirect('main');
	}
});

//done, Get restaurant's info page
app.get('/restaurant', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('login');
	} 
	else{
var criteria = {};
	req.session.id = req.query._id;
  MongoClient.connect(mongourl,function(err,db) {
    assert.equal(err,null);
		console.log('connect to MongoDB\n');
    db.collection('restaurant').findOne(ObjectId(req.query._id),function(err,doc){
      assert.equal(err,null);
				res.render('restaurant', {r : doc});
				console.log(doc);
    });
  });

	}
});



//done, Get create restaurant page
app.get('/create', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('/login');
	} 
	else{
		res.status(200);
		res.render('create');

	}
});

//done, Get create restaurant page
app.get('/updateRestaurant', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('/login');
	} 
	else{
		res.status(200);
		res.render('updateRestaurant');

	}
});

//Get search-result page
app.get('/search', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('login');
	} 
	else{
		res.status(200);
		res.render('search');
	}
});


app.post('/search', function(req,res) {
	//check login or not
	if (!req.session.authenticated) {
		res.redirect('login');
	} 
	else{
		var criteria = {};
		for (key in req.body) { //req.body can use??
			criteria[key] = req.body[key];
		}
		console.log('/search criteria = '+JSON.stringify(criteria));
	//	read_n_print(res,criteria,0);
	}
});


//done, create restaurant
app.post('/create', function(req,res) {
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('login');
	} 
	else{
		res.status(200);
		console.log('prepare create');
		create(req);
		console.log('create successful');
		res.redirect('main');
	}
});


app.post('/restaurant', function(req,res) {
	//check login or not
	if (!req.session.authenticated) {
					res.status(200);
					res.redirect('login');
				} 
	else{
		//check grade exist
		var notExist = gradeExist(req,res,function(result){
			var check = {};
			check=JSON.stringify(result);
			console.log('check : '+ check);
			console.log('check name: '+ JSON.stringify(result.grade));

			if(JSON.stringify(result.grade)){				
				res.status(200);
				console.log('insert grade already');
				res.redirect('/allRestaurant');
			}
			else{
				console.log('prepare create');
				insertGrade(req,res);
				console.log('create successful');
				res.redirect('main');
			}
		});
	}
});

//done, create restaurant
app.post('/updateRestaurant', function(req,res) {
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('login');
	} 
	else{
		res.status(200);
		console.log('prepare updateRestaurant');
		update(req,res)
		console.log('updateRestaurant successful');
		res.redirect('main');		
	}	
});

//Get main page
app.get('/main', function(req,res){
	console.log(req.session);
	//check login or not
	if (!req.session.authenticated) {
		res.status(200);
		res.redirect('login');
	} 
	else{
		res.status(200);
		//queryAsObject.max is what?
		//var max = (queryAsObject.max) ? Number(queryAsObject.max) : 20;
		//console.log('/read max = ' + max);
		res.render('main');
	}	
});

function read_n_print(res,criteria,max,callback) {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		findRestaurants(db,criteria,max,function(restaurants) {
			db.close();
			console.log('Disconnected MongoDB\n');
			if (restaurants.length == 0) {
				//res.status(500);
				//res.status(500);
				res.end('Not found!');
			} else {
				res.status(200);
				//res.writeHead(200, {"Content-Type": "text/html"});   
				/*res.write('<html><head><link rel="stylesheet" href="assets/css/main.css" /></head></head>');
				res.write('<body> <section id="banner"><H1>Restaurants</H1>');
				res.write('<header><H2>Showing '+restaurants.length+' document(s)</H2></header></section> ');
				res.write('<section id="two" class="wrapper style2 special"><div class="inner narrow"><ol>');
				for (var i in restaurants) {
				res.write('<li><a href=/restaurant?_id='+
				restaurants[i]._id+'>'+restaurants[i].name+
				'</a></li>');
				}
				res.write('</ol></div></section>');
				res.end('</body></html>')*/
				res.render('allRestaurant',{restaurants:restaurants});
				return(restaurants);
			}
		}); 
	});
}

function findRestaurants(db,criteria,max,callback) {
	var restaurants = [];
	//main page, show all restaurant
	if (max == 1) {
		cursor = db.collection('restaurant').find(criteria); 		
	} 
	else {
		cursor = db.conllection('restaurant').find(criteria); 				
	}
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}


// done, Check user name and password and login
app.post('/login',function(req,res) {
	console.log(req.session);
	var notExist = accountexist(req,res,function(result){
		console.log('result: '+JSON.stringify(result));
		if(result){
			res.status(200);
			console.log('login acc successful');
			
			req.session.authenticated = true;
			req.session.username = req.body.username;
			res.redirect('/main');
		}
		else{
			console.log('wrong accname or pw');
			res.status(200);
			res.redirect('/login');
		}
	});
	//res.redirect('/');			
});




//done, check account exist or not
function accountexist(req,res,callback){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		getAccout(req,db, function(result){
			db.close();
			console.log('Json-result: '+JSON.stringify(result));		
			callback(result);
			if(JSON.stringify(result))
				return false;
			else 
				return true;
			//callback(result);
		});
	});
}
//done, Get account info
function getAccout(req,db,callback){
	console.log('finding')
	db.collection('user').findOne(
		{username: req.body.username, password: req.body.password},function(err,result){
		assert.equal(err,null);
		console.log("Get info was successful!");
		callback(result);
	});
}


//done, check account exist or not
function gradeExist(req,res,callback){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		checkGrade(req,db, function(result){
			db.close();
			console.log('Json-result: '+JSON.stringify(result));		
			callback(result);
			if(JSON.stringify(result))
		 		return false;
			else 
				return true;
			//callback(result);
		});
	});
}
//done, Get account info
function checkGrade(req,db,callback){
	console.log('finding')

	//db.restaurant.findOne({"_id":ObjectId("5a259e7a27cef00036fad70d")},{grade:{$elemMatch:{username:"123"}}})
	db.collection('restaurant').findOne(
		{_id: ObjectId(req.session.id)},{grade:{$elemMatch:{username: req.session.username}}},function(err,result){
		assert.equal(err,null);
		console.log("check grade was successful!");
		callback(result);
	});
}





// done, Create account + checking password
app.post('/register',function(req,res){
	
	if(req.body['password-repeat'] != req.body['password']){
		console.log('password mismatch.');
		res.status(200);
		res.redirect('/register');
	}
	else{		
		var notUnique = userexist(req,res,function(result){
			console.log('result: '+result);
			if(result){
				console.log('refresh reg page');
				res.redirect('/register');
			}
			else{
				createuser(req);
				console.log('create acc successful');
				res.status(200);
				res.redirect('/login');
			}
		});
	}
});

//done, check username exist or not
function userexist(req,res,callback){
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		getUser(req,db, function(result){
			db.close();
			console.log('Json-result: '+JSON.stringify(result));		
			callback(result);
			if(JSON.stringify(result))
				return false;
			else 
				return true;
			//callback(result);
		});
	});
}
//done, get user info
function getUser(req,db,callback){
	db.collection('user').findOne(
		{username: req.body.username},function(err,result){
		assert.equal(err,null);
		console.log("Get info was successful!");
		callback(result);
	});
}
//done
function createuser(req) {
	console.log('create new_u');
	var new_u = {};
	if (req.body.username) 
		new_u['username'] = req.body.username;
	if (req.body.password) 
		new_u['password'] = req.body.password;
	console.log('About to insert: ' + JSON.stringify(new_u));
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		insertUser(db,new_u,function(result){
			db.close();
			console.log(JSON.stringify(result));			
		});
	});
}

// done, create restaurant
function create(req) {
	console.log('test');
	var new_r = {};	// document to be inserted
	if (req.body.name) new_r['name'] = req.body.name;
	if (req.body.borough) new_r['borough'] = req.body.borough;
	else new_r['borough'] = null;
	if (req.body.cuisine) new_r['cuisine'] = req.body.cuisine;
	else new_r['cuisine'] = null;
	if (req.body.photo) new_r['photo'] = req.body.photo;
	else new_r['photo'] = null;
	new_r['grade'] = [];
	new_r['owner'] = req.session.username;
	var address = {};
	if (req.body.building) address['building'] = req.body.building;
	else address['building'] = null;
	if (req.body.street) address['street'] = req.body.street;
	else address['street'] = null;
	if (req.body.lat) address['lat'] = req.body.lat;
	else address['lat'] = null;
	if (req.body.long) address['long'] = req.body.long;
	else address['long'] = null;
	new_r['address'] = address;

	console.log('About to insert: ' + JSON.stringify(new_r));

	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		insertRestaurant(db,new_r,function(result) {
			db.close();
			console.log(JSON.stringify(result));
		});
	});
}

// done, User logout
app.get('/logout',function(req,res) {
	req.session = null;
	res.status(200);
	res.redirect('/login');
});

//done, insert the data to data of create restaurnt
function insertRestaurant(db,r,callback) {
	//db.collection('user').insertOne(r,function(err,result) {// check user+modify
	db.collection('restaurant').insertOne(r,function(err,result){
		assert.equal(err,null);
		console.log("Insert was successful!");
		callback(result);
	});
}

function insertGrade(req,res){

	var new_r = {};	
	new_r['username'] = req.session.username;
	new_r['score'] = req.body.score;
	console.log('About to insert: ' + JSON.stringify(new_r));

	MongoClient.connect(mongourl,function(err,db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			grade(req,db,new_r,function(result) {
				db.close();
				console.log(JSON.stringify(result));
			});
	});
}

function grade(req,db,g,callback){
	db.collection('restaurant').updateOne({_id: ObjectId(req.session.id)},{$push:{grade:g}},function(err,result) {
			assert.equal(err,null);
			console.log("update was successfully");

			callback(result);
});
}




//cannot check user exist, can put data to db
function insertUser(db,u,callback) {
	console.log('prepare to insert');
	db.collection('user').insertOne(u,function(err,result) {
		assert.equal(err,null);
		console.log("Insert was successful!");
		callback(result);
	});
}

// need to test
function update(req,res) {
	console.log('test');
		var new_r = {};	// document to be inserted
	if (req.body.name) new_r['name'] = req.body.name;
	if (req.body.borough) new_r['borough'] = req.body.borough;
	if (req.body.cuisine) new_r['cuisine'] = req.body.cuisine;

	if(req.body.building || req.body.street||req.body.lat||req.body.long){
		var address = {};
		if (req.body.building) address['building'] = req.body.building;
		else address['building'] = null;
		if (req.body.street) address['street'] = req.body.street;
		else address['street'] = null;
		if (req.body.lat) address['lat'] = req.body.lat;
		else address['lat'] = null;
		if (req.body.long) address['long'] = req.body.long;
		else address['long'] = null;
		new_r['address'] = address;
	}
	

	console.log('About to insert: ' + JSON.stringify(new_r));

	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
	
		updateRestaurant(req,db,new_r,function(result) {
			db.close();
			console.log(JSON.stringify(result));
			
		});
	
	});
}
// need to test
function updateRestaurant(req,db,newValues,callback) {
		console.log('id: '+req.session.id);
		db.collection('restaurant').updateOne({_id: ObjectId(req.session.id)},{$set: newValues},function(err,result){
		assert.equal(err,null);
		console.log("update was successful!");
		callback(result);
	});
}

// need to test
function remove(res,req,callback) {
	console.log('About to delete ' + JSON.stringify(req.session.name));
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		deleteRestaurant(db,req,function(result) {
			db.close();
			console.log(JSON.stringify(result));
			callback(result);			
		});
	});
}

// need to test
function deleteRestaurant(db,req,callback) {

	db.collection('restaurant').deleteOne({ _id:ObjectId(req.session.id), owner: req.session.username },function(err,result) {
		assert.equal(err,null);
		console.log("Delete was successfully");
		callback(result);
	});
}

app.get('/map', function(req,res) {
	console.log({ lat: req.query.lat,lon:req.query.lon});
  res.render('gmap',
             { lat: req.query.lat,lon:req.query.lon});
});


/*

function findDistinctBorough(db,callback) {
	db.collection('restaurants').distinct("borough", function(err,result) {
		console.log(result);
		callback(result);
	});
}
*/
app.listen(process.env.PORT || 8099);
