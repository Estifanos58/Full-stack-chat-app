import { Server as ServerIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/ChannelModel.js"

const setupSocket = (server) => {
    const io = new ServerIOServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials:true
        }
    });

    const userSocketMap = new Map();

    const disconnect = (socket)=>{
        console.log(`User disconnected: ${socket.id}`);
        for(const [userId, socketId] of userSocketMap.entries()){
            if(socketId === socket.id){
                userSocketMap.delete(userId);
                console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    }

    const sendMessage = async( message )=>{
        // console.log(message)
        const senderSocketId  = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const createdMessage = await Message.create(message);

        const messageData = await Message.findById(createdMessage._id)
        .populate("sender","id email firstName lastName image color")
        .populate("recipient","id email firstName lastName image color")

        // console.log(messageData)
        if(recipientSocketId){
            io.to(recipientSocketId).emit("recieveMessage", messageData);
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("recieveMessage", messageData);
        }
    }

    const sendChannelMessage = async (message)=>{
        const {sender, channelId, content, messageType, fileUrl} = message;

        const createMessage = await Message.create({
            sender,
            recipient: null,
            content,
            messageType,
            timestamps: new Date(),
            fileUrl,
        });

        const messageData = await Message.findById(createMessage._id)
        .populate("sender", "id email firstname lastname image color")
        .exec();
        await Channel.findByIdAndUpdate(channelId, {
            $push: { messages: createMessage._id},
        });
        
        const channel = await Channel.findById(channelId).populate("members");

        const finalData = { ...messageData._doc, channelId: channel._id};

        if(channel && channel.members){
            channel.members.forEach((member)=>{
                const memberSocketId = userSocketMap.get(member._id.toString());
                if(memberSocketId){
                    io.to(memberSocketId).emit("recieve-channel-message", finalData);
                }
            })
            const adminSocketId = userSocketMap.get(channel.admin._id.toString());
                if(adminSocketId){
                    io.to(adminSocketId).emit("recieve-channel-message", finalData);
                }
        }

    }

    io.on('connection', (socket) => {
       const userId = socket.handshake.query.userId;

       if(userId){
            userSocketMap.set(userId, socket.id);
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
       }else{
           console.log('User connected with no user ID');
       }

       socket.on("send-channel-message", sendChannelMessage)
       socket.on("sendMessage", sendMessage)
       socket.on('disconnect',()=> disconnect(socket))
    });



}

export default setupSocket;