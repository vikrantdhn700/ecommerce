import mongoose from "mongoose";

const settingSchema = mongoose.Schema({
    meta_key: {type:String, required:true, trim:true, unique : true},
    meta_value: {type:String, trim:true}  
},{ timestamps: true });

const settingModel= mongoose.model('settings',settingSchema);
export default settingModel;