console.log('Yes!!! The node is up and running.')

const express = require('express');
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const mongodb = require('mongodb');
const session = require('express-session');

// handles URL encoded bodies
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
var path=require('path');
app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'jade');
app.set('port', (process.env.PORT || 30000));
app.use(express.static(__dirname + '/images/'));

app.listen(30000, function() {
  console.log('listening on 30000')
})


const database_URL="mongodb://localhost:27017/URL_Shortning_Database"; 
/*app.get('/', function(req, res) {
  res.send('Hello World')
})*/
//----- Sanjoy's login module start-------------------
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/login.html')
})

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/pages/signup.html')
})

app.post('/login', (req, res) => {
 console.log(req.body.username);
 console.log(req.body.password);
 

 MongoClient.connect(database_URL, (err, db) => {
   if (err) {
     return console.log('Unable to connect to MongoDB server');
   }
   console.log('Connected to MongoDB server...');

     var insertResult,sendingResult;

     db.collection("loginDetails").findOne({username:req.body.username,password:req.body.password}, function(err, result) {
      if (err) throw err;
      console.log(result);
      if(result&&result.username!='' && result.password!=''){
        console.log("User Presence");
        console.log(result.username);

        req.session.user_id = req.body.username;
        result=req.session;
        res.render('index',{id:req.body.username});

        }else {
         res.sendFile(__dirname + '/pages/errorLogin.html')
         }
    });
    db.close();
    });
 });



app.post('/logout', function (req, res) {
  delete req.session.user_id;
  req.session.destroy();
  console.log("Logging Out");
  res.redirect('/');
});

app.post('/register', (req, res) => {
   console.log(req.body.username);
   console.log(req.body.password);

   var registerVariable = {
     username: req.body.username,
     password: req.body.password
   };
   MongoClient.connect(database_URL, (err, db) => {
     if (err) {
       return console.log('Unable to connect to MongoDB server');
     }
     console.log('Connected to MongoDB server...');

       var insertResult,sendingResult;

     db.collection("loginDetails").insertOne(registerVariable,(err, result)=>{
       if (err) {
         res.status(400).send(err);
         console.log(err);
       }else{
         console.log("Registered");
         req.session.user_id = req.body.username;
         result=req.session;
         res.render('index',{id:req.body.username});

       }
      db.close();
     });
   });
 });
//----- Sanjoy's login module end-------------------

// Same as above
app.get('/home', (req, res) => {
  //res.send('hello world')
  res.sendFile(__dirname + '/pages/index.html')
})

//------This is when the link does not exist---------
app.get('/err', (req, res) => {
  res.sendFile(__dirname + '/pages/error.html')
})


function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getID(){

    var text;
	MongoClient.connect(database_URL, (err, db) => {
	  if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server...');

	  var temp;
	  while(true)
	  {
	  	text=makeid();
	  	console.log("Text="+text);
		 db.collection("urlDetails").findOne({shortUrl: text}, function(err1, doc) {
		    if(doc)
		           temp=doc.value;
		    else
		    	temp=null;
	    //db.close();
		  });
         if(temp==null)
         {
           return text;	
           break; 
         }
	  }
	 
	});
	console.log("final Text="+text);
      
}

//-------This is when the shortening of the url is being called-------------
app.post('/urlCaller', (req, res) => {
  console.log(req.body)

  //var computedShortURL=getID();
  var computedShortURL=makeid();
   //console.log("final Text="+computedShortURL);
  var date = new Date();
  var month=date.getMonth()+1;
  var today = date.getDate()+'/'+month+'/'+date.getFullYear();

  var urlVariable = {
    mainUrl: req.body.longUrl,
    shortUrl: computedShortURL,
    count: 0,
    userId: req.body.userID,
 };

  MongoClient.connect(database_URL, (err, db) => {
	  if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server  for creation of short url...');
      
      var insertResult,sendingResult;

	  db.collection("urlDetails").insertOne(urlVariable,(err, result)=>{
	  	if (err) {
	      res.status(400).send(err);
	      console.log(err);
	    }else{
	    	insertResult=JSON.stringify(result.ops);
	    	 console.log("The result after querying-------->>>");
	 

  			db.collection("urlDetails").find({userId: req.body.userID}).toArray(function(err1, result1) {
			    if (err1) throw err1;
			    // console.log(result1);
			   // db.close();
			   sendingResult=JSON.stringify(result1);
			   console.log("Json being send-------->>>");
			   sendingResult=insertResult.substring(0,insertResult.length-1)+","+sendingResult.substring(1,sendingResult.length);
			   console.log(sendingResult);
			   res.send(sendingResult);
			  });
	    }
        
	  	// console.log(sendingResult);
    //   	res.send(sendingResult);	
	  	db.close();
	  });

	});
});

//---------------The graph data is sent from here
app.post('/graph', function(req,res){
	console.log(req.body.urlId);
	MongoClient.connect(database_URL, (err, db) => {
	 if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server for graph...');

      var sendingResult;
      if((req.body.urlId).localeCompare('OverAll')==0){
      		// db.collection("countDetails").aggregate([{ $group: {_id: { "odate": "$odate", "date":"$date"} ,total: { $sum: "$count" }} },{ $sort: { _id: 1 }}]).toArray(function(err, docs){
      			db.collection("countDetails").aggregate([{ $match: {userId: req.body.userID } },{ $group: {_id: "$date" ,total: { $sum: "$count" }} },{ $sort: { _id: 1 }}]).toArray(function(err, docs){
	  	    console.log('##################');
	  	    console.log(docs);
	  		//sendingResult=JSON.stringify(docs);
	  		//console.log(sendingResult);
	  		sendingResult="{  data: { json:"+sendingResult+", keys: {value: ['hits', 'days']}},axis: {x: {}}}";
	  		// res.send(sendingResult);   
	  		res.send(docs);   
	  		db.close();
	  		});	
      }
      else
      {
      		// db.collection("countDetails").aggregate([{ $match: { shortUrl: req.body.id } },{ $group: {_id: { "odate": "$odate", "date":"$date"},total: { $sum: "$count" }} },{ $sort: { _id: 1 }}]).toArray(function(err, docs){
      			db.collection("countDetails").aggregate([{ $match: { shortUrl: req.body.urlId, userId: req.body.userID } },{ $group: {_id: "$date",total: { $sum: "$count" }} },{ $sort: { _id: 1 }}]).toArray(function(err, docs){
	  	    console.log('##################');
	  	    console.log(docs);
	  		sendingResult=JSON.stringify(docs);
	  		// console.log(sendingResult);
	  		sendingResult="{  data: { json:"+sendingResult+", keys: {value: ['total']}},axis: {x: {}}}";
	  		// res.send(sendingResult);    
	  		res.send(docs);    
	  		db.close();
	  		});	
      }
      

	  
	  	
	});
})


//---------------This is for deletion of the given links
app.post('/deletion', function(req, res){
	console.log(req.body.id);
	console.log(req.body.userID);

	MongoClient.connect(database_URL, (err, db) => {
	  if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server for deletion...');
      
      var insertResult,sendingResult;

	  db.collection("urlDetails").deleteOne({ _id: new mongodb.ObjectID(req.body.id)}, function(err, result){
	  	    if (err) {
		      res.status(400).send(err);
		      console.log(err);
		    }else{

	  			db.collection("urlDetails").find({userId: req.body.userID}).toArray(function(err1, result1) {
				    if (err1) throw err1;
				    // console.log(result1);
				   // db.close();
				   sendingResult=JSON.stringify(result1);
				   console.log("Json being send-------->>>");
				   //sendingResult=insertResult.substring(0,insertResult.length-1)+","+sendingResult.substring(1,sendingResult.length);
				   console.log(sendingResult);
				   res.send(sendingResult);
				  });
		    }
	  		db.close();
	  });

	});

});


//---------------This is for displaying the links on initial load
app.post('/displayTableonLoad', function(req, res){
	console.log(req.body.userID);

	MongoClient.connect(database_URL, (err, db) => {
	  if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server for displaying Table on Load...');
      
      var insertResult,sendingResult;
				db.collection("urlDetails").find({userId: req.body.userID}).toArray(function(err1, result1) {
				    if (err1) throw err1;
				    // console.log(result1);
				   // db.close();
				   sendingResult=JSON.stringify(result1);
				   console.log("Json being send-------->>>");
				   //sendingResult=insertResult.substring(0,insertResult.length-1)+","+sendingResult.substring(1,sendingResult.length);
				   console.log(sendingResult);
				   res.send(sendingResult);
				   db.close();
				  });
		    
	  		
	  

	});

});

//-------------This is when the short link is being called which redirects to the original url and-------------------------------------------- 
//-------------also in case of not existing url redirects to error page----------------
app.get('/:encoded_id', function(req, res){

  console.log(req.params.encoded_id);

  MongoClient.connect(database_URL, (err, db) => {
	  if (err) {
	    return console.log('Unable to connect to MongoDB server');
	  }
	  console.log('Connected to MongoDB server  for short to longURL...');

      var date = new Date();
      var day=date.getDate();
      var month=date.getMonth()+1;
      if(month<10)
      	month='0'+month;
      if(day<10)
      	day='0'+day;

	  var today = date.getDate()+'/'+month+'/'+date.getFullYear();
      
      var ndate = parseInt(date.getFullYear()+''+month+''+day);
      console.log(ndate);
      
      var countVariable = {
	    shortUrl: req.params.encoded_id,
	    count:1,
	    date:today,
	    odate:ndate
	  };
  
	  db.collection('urlDetails').findOneAndUpdate({shortUrl:req.params.encoded_id},{$inc:{count:1}},function (err, doc){
	  	//var jsonObj = JSON.parse(JSON.stringify(res));
	    if (doc.value) {
	      res.redirect(doc.value.mainUrl);
	      var countVariable = {
		    shortUrl: req.params.encoded_id,
		    count:1,
		    date:today,
		    odate:ndate,
		    userId:doc.value.userId
		  };
           db.collection('countDetails').findOneAndUpdate({shortUrl:req.params.encoded_id,date:today},{$inc:{count:1}},function (err, doc){
                if(!doc.value){
                		db.collection("countDetails").insertOne(countVariable,(err, result)=>{
                			if (err) {
						      console.log(err);
						    }else
						    {
						    	console.log(result.ops);
						    }
                		});
                		db.close();
                }
                else
                	db.close();
                
           });


	     } else {
	      res.redirect('/err');
	    }
	    
	  });

	  
	})
});
