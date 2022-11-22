const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ptptzcl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// jwt token verify function
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'Unauthorized Access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next()
    })
}



async function run(){
    try{
        const servicesCollction = client.db('dentaCareDb').collection('services');
        const reviewCollection = client.db('dentaCareDb').collection('reviews');
        
        // json web token
        app.post('/jwt', (req, res)=>{
            const user = req.body;
            console.log(user); 
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5h'})
            res.send({token})
        })


        // services API
        app.get('/services', async(req, res)=>{
            const query = {};
            const cursor = servicesCollction.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })
        app.post('/services', async(req, res)=>{
            const service = req.body;
            const result = await servicesCollction.insertOne(service);
            res.send(result)
        })

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const service = await servicesCollction.findOne(query);
            res.send(service)
        })


        // reviews API
        app.post('/reviews', async(req, res)=>{
            const reviews = req.body;
            const result = await reviewCollection.insertOne(reviews);
            res.send(result)
        })
        app.get('/service-reviews', async(req, res)=>{
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews)
        })
        app.get('/reviews', verifyJWT, async(req, res)=>{
            const decoded =req.decoded;
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }
            let query = {};
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews)
        })

    }
    finally{
    }

}
run()
.catch(err=>console.log(err))

app.get('/', (req, res)=>{
    res.send('DentaCare API is running')
})
app.listen(port, ()=>{
    console.log(`DentaCare Server running on port ${port}`);
})

