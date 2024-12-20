import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import authRoutes from './routes/AuthRoute.js'
import path from 'path'
import { contactsRoutes } from './routes/ContactRoutes.js'
import setupSocket from './socket.js'
import messagesRoute from './routes/MessagesRoute.js'
import channelRoutes from './routes/ChannelRoutes.js'


dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

const corsOptions = {  
    origin: true || process.env.ORIGION || 'http://localhost:5173', // Allow requests from this origin  
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods  
    credentials: true, // Allow cookies to be passed  
  }; 

app.use(cors(corsOptions))
// app.use(cors())

app.use("/uploads/profiles", express.static(('./uploads/profiles')));
app.use('/uploads/files', express.static(("./uploads/files")));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes)
app.use('/api/messages', messagesRoute);
app.use('/api/channel', channelRoutes)


const server = app.listen(port, ()=>{
    console.log(`Server is running http://localhost:${port}`);
})

setupSocket(server)

mongoose.connect(databaseURL).then(()=>console.log('DB Connection Successful')).catch(err=> console.log(err.message))

