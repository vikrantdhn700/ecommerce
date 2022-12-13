import mongoose from "mongoose";

const adminSchema = mongoose.Schema({
    name: {type:String, required:true, trim:true},
    email: {type:String, required:true, trim:true, unique: true},
    password: {type:String, required:true, trim:true},
    token: {type:String, trim:true}    
},{ timestamps: true });

const adminModel= mongoose.model('admins',adminSchema);
export default adminModel;