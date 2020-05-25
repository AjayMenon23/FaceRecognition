const express = require('express');

const app =express();
const bodyParser= require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex =require('knex');


const Clarifai = require('clarifai');

const clarifai = new Clarifai.App({
 apiKey: 'abdddf2181e8427881fbcc60b7f7c7d7'
});


function handleApiCall(req,res){
 clarifai.models.predict(Clarifai.FACE_DETECT_MODEL,req.body.input)
 .then(data=>{
 	res.json(data)
 })
 .catch(err => res.status(400).json('Unable to work with API'))
}

const db=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'root',
    database : 'facesmart'
  }
});

app.use(bodyParser.json());
app.use(cors());


//db.select('*').from('users').then(data=>{console.log(data)});


app.get('/', (req,res)=>{
	//res.send('Iam awesome')
	res.send('Yaay!! Working!!')
})


app.post('/signin', (req,res)=>{
	const {email,password} = req.body;
	if(!email || !password ){
		return res.status(400).json('incorrect form submission')
	}
	db.select('email','hash').from('login')
	.where('email','=',req.body.email)
	.then(data =>{
		const isValid = bcrypt.compareSync(req.body.password,data[0].hash)
		if(isValid){
			return db.select('*').from('users')
			.where('email','=',req.body.email)
			.then(user =>{
				res.json(user[0])
			})
			.catch(err => res.status(400).json('User not found'))
		}
		else{
			res.status(400).json('Check credentials');
		}
	})
	.catch(err => res.status(400).json('Check credentials'))
})

app.post('/register',(req,res)=>{
	const {email,name,password} = req.body;
	if(!email || !name || !password ){
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);
		db.transaction(trx =>{
			trx.insert({
				hash : hash,
				email:email
			})
			.into('login')
			.returning('email')
			.then(loginEmail=>{
				return	trx('users').returning('*')
				.insert({
				email :loginEmail[0],
				name: name,
				joined: new Date()

				})
				.then(response=>{
					res.json(response[0]);
				})
			})
				.then(trx.commit)
				.catch(trx.rollback)
		})
		.catch(err => res.status(400).json('unable to register'))
	//res.json(database.users[database.users.length-1])
})


app.get('/profile/:id',(req,res)=>{

	const {id}= req.params;
	//let found=false;  
	db.select('*').from('users').where({id :id}).then(user =>{
		if(user.length){
		res.json(user[0]);//.json(user[0])
		}
		else{
			res.status(400).json('user not found')
		}
	}).catch(err => res.status(400).json('cannot find user'))
		// if(!found){


		// 	res.status(400).json('no such user');	
		// }


})



app.post('/imageurl',(req,res)=>{
	
	handleApiCall(req,res)
	//res.json(database.users[database.users.length-1])
})

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// }); 






app.listen(3000, () => {
	console.log('app is running in port 3000')
});