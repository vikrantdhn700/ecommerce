import mongoose from "mongoose";

const connection = async (dbuser, dbpass,url) => {
    try{
        await mongoose.connect(url,{useNewUrlParser: true, useUnifiedTopology: true});
        //console.log(`Database connected successfully`);
    } catch(error){
        console.log(`Error While Connecting With Database`, error);
    }
}

export default connection;