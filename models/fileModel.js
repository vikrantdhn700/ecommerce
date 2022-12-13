import mongoose from "mongoose";

const fileSchema = mongoose.Schema({
    filename: {type:String, required:true, trim:true},
    originalname: {type:String, required:true, trim:true},
    destination: {type:String, required:true, trim:true},
    path: {type:String, required:true, trim:true},
    size: {type:String, required:true, trim:true},
    type: {type:String, required:true, trim:true}    
},{ timestamps: true });

const fileModel= mongoose.model('files',fileSchema);
export default fileModel;