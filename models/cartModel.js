import mongoose from "mongoose";
import userModel from "./userModel.js";
import productModel from "./productModel.js";

const cartSchema = new mongoose.Schema({
    user : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    cart_items : {
        type: String,
        required: true,
        trim:true
    }
    }, {
    timestamps: true
})

const cartModel= mongoose.model('carts',cartSchema);
export default cartModel;