const express = require('express')
const app = express()
const cors = require('cors')
const mongoose=require('mongoose')
const req = require('express/lib/request')
require('dotenv').config({path:"./sample.env"})

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
mongoose.connect(process.env.MONGO_URI)
      .then(()=>console.log("connection to mongodb avec seccefly."))
      .catch((error)=>console.error("somthings is wrong =>",error))
const userSchema=new mongoose.Schema({
  username:{
    type:String,
    required:true,
    unique:true
  }
})

const exerciseSchema =new mongoose.Schema({
  userId:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  date:{
    type:Date,
    default:Date.now
  },
})
const User =mongoose.model("User",userSchema)
const Exercise =mongoose.model("Exercise",exerciseSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",async(req,res)=>{
  const {username}=req.body;
  try {
    const newUser =new User({username})
    await newUser.save()
    res.json({
      username:newUser.username,
      _id:newUser._id
    })
  } catch (error) {
    res.json({error:"Username is required or already exists"})
  }
})
app.post("/api/users/:_id/exercises",async(req,res)=>{
  const {_id}=req.params;
  const{description, duration, date}=req.body
  try {
    const user=await User.findById(_id)
    if(!user) return res.json({error:"user not found"})
      const exercise =new Exercise({
        userId:user._id,
        description,
        duration:parseInt(duration),
        date: date ? new Date(date) :undefined
    })
    await exercise.save()
    res.json({
      username:user.username,
      description:exercise.description,
      duration:exercise.duration,
      date:exercise.date.toDateString(),
      _id:user._id
    })
  } catch (error) {
    res.json({error:"Invalid input or user ID",error})
  }
})
app.get("/api/users/:_id/logs",async(req,res)=>{
  const {_id}=req.params;
  const {from,to,limit}=req.query
  try {
    const user=await User.findById(_id)
    if(!user) return res.json({error:"user not found"})
      let filter = { userId: _id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const exercises = await Exercise.find(filter)
      .limit(parseInt(limit) || 0)
      .select('description duration date');

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString(),
      })),
    });
  } catch (error) {
    res.json("Invalid query or user ID",error)
  }
})
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' });
  }
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
