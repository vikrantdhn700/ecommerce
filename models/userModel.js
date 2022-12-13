import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {type:String, required:true, trim:true},
    email: {type:String, required:true, trim:true, unique: true},
    phone: {type:Number, required:true, trim:true, min:10},
    password: {type:String, required:true, trim:true},
    tc: {type:Boolean, required:true},
    token: {type:String, trim:true}    
},{ timestamps: true });

const userModel= mongoose.model('users',userSchema);
export default userModel;