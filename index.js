const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
// bodyparser
const bodyParser = require("body-parser");
// mongoose
const mongoose = require('mongoose')


// Conecting to mongoose (Database)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Creating schemas
let Schema = mongoose.Schema
let userSchema = new Schema({
  username: {type: String, required: true},
}, {
  versionKey: false
})
let User = mongoose.model("User", userSchema)

let exSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String
}, {
  versionKey: false
})

let Exercise = mongoose.model("Exercise", exSchema)


app.use(cors())
app.use(express.static('public'))
// url encode
app.use(bodyParser.urlencoded({extended: false}))

// Creating users in db
app.post('/api/users', async function (req, res) {
  try {
    let username = req.body.username
    let user = new User({username: username})
    await user.save()
    let findUser = await User.findOne({username: username})
    res.json({"username": findUser.username,"_id": findUser._id})
    
  } catch (error) {
    console.error(error)
  }
})


// Post returns user object and exercises
app.post('/api/users/:_id/exercises', async function (req, res) {
  try {
    let id = req.params._id || req.body._id
    let description = req.body.description
    let duration = req.body.duration
    let date = req.body.date
    // If no date is added, use current date
    if (date == undefined){
      date = new Date()
    }
    let findId = await User.findById(id)
    if (findId){
      let exercise = new Exercise({
        username: findId.username,
        description: description,
        duration: duration,
        date: date,
        userId: id
      })
      await exercise.save()
      let findExercise = await Exercise.findOne({
        username: findId.username,
        description: description,
        duration: duration,
        date: date
      })
      res.json({"_id": findId._id, "username": findId.username , "date": new Date(findExercise.date).toDateString(), "duration": findExercise.duration,"description": findExercise.description})
    } else {
      res.json({"error":"Invalid Id"})
    }
  }catch (err) {
    console.error(err)
  }
})


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// gets user list
app.get('/api/users', async (req, res) =>{
  let users = await User.find()
  res.json(users)
})


// gets exercise logs from a specific user
app.get('/api/users/:_id/logs', async (req, res) =>{
  try{
    let id = req.params._id
    let from =  new Date(req.query.from)
    let to = new Date(req.query.to)
    let limit = parseInt(req.query.limit)
    // if no limit is defined, show all user logs
    if(isNaN(limit)){
      limit = Infinity
    }
    let count = 0
    if (from != 'Invalid Date' || to != 'Invalid Date'){
      let findId = await User.findById(id)
      let findExercise = await Exercise.find({
        userId: id,
        date1: { $gte: new Date(req.query.from), $lte: new Date(req.query.to)}
      }, {
        username: 0,
        userId: 0,
        _id: 0
      }).limit(limit).lean()
      for (i in findExercise) {
        count ++
      }
      let log = []
      findExercise.map(x => log.push({
        description: x.description,
        duration: x.duration,
        date: new Date(x.date).toDateString()
      }))
     
      res.json({"_id": findId._id, "username": findId.username, "count": count, "log": log})
    } else {
     
      let findId = await User.findById(id)
      let findExercise = await Exercise.find({
        userId: id
      }, {
        username: 0,
        userId: 0,
        _id: 0
      }).lean().limit(limit)
      for (i in findExercise) {
        count ++
      }
      let log = []
      findExercise.map(x => log.push({
        description: x.description,
        duration: x.duration,
        date: new Date(x.date).toDateString()
      }))
      
      res.json({"_id": findId._id, "username": findId.username, "count": count, "log": log})
    }
  }catch (err) {
    console.error(err)
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
