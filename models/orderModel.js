import mongoose from "mongoose";
import userModel from "./userModel.js";
import productModel from "./productModel.js";

function getCosts(value) {
    if (typeof value !== 'undefined') {
       return parseFloat(value.toString());
    }
    return value;
};

const orderSchema = new mongoose.Schema({
    user : {
      type: mongoose.Schema.Types.ObjectId,
       required: true,
       ref: 'users'
    },
    cart_items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        image: {
            type: String,
            trim:true
        },
        slug: {
            type: String,
            required: true,
            trim:true
        },
        name: {
            type: String,
            required: true,
            trim:true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: 0,
            get: getCosts
        }
    }],
    total: {
        type: Number,
        required: true,
        default: 0
      },
    billinginfo : [{
        billing_firstname : {
            type: String,
            require: true,
            trim: true
        },
        billing_lastname : {
            type: String,
            require: true,
            trim: true
        },
        billing_email : {
            type : String,
            require: true,
            trim: true
        },
        billing_phone : {
            type : Number,
            require : true,
            trim: true
        },
        billing_address : {
            type : String,
            require: true,
            trim: true
        },
        billing_address2 : {
            type : String,
            trim: true,
            default: ''
        },
        billing_country : {
            type : String,
            require: true,
            trim: true
        },
        billing_state : {
            type : String,
            require: true,
            trim: true
        },
        billing_zip : {
            type : String,
            require: true,
            trim: true
        }
    }],
    shippinginfo : [{
            shipping_firstname : {
                type: String,
                require: true,
                trim: true
            },
            shipping_lastname : {
                type : String,
                require: true,
                trim: true
            },
            shipping_email : {
                type : String,
                require : true,
                trim: true
            },
            shipping_phone : {
                type : String,
                require: true,
                trim: true
            },
            shipping_address : {
                type : String,
                trim: true,
                default: ''
            },
            shipping_address2 : {
                type : String,
                require: true,
                trim: true
            },
            shipping_country : {
                type : String,
                require: true,
                trim: true
            },
            shipping_state : {
                type : String,
                require: true,
                trim: true
            },
            shipping_zip : {
                type : String,
                require: true,
                trim: true
            }
    }],
    paymenttype: {
        type : String,
        require: true,
        trim: true
    },
    paymentmethod: {
        type : String,
        require: true,
        trim: true
    },
    paymentstatus : {
        type : String,
        require: true,
        trim: true
    },
    customer_id : {
        type : String,
        require: true,
        trim: true
    },
    payment_id : {
        type : String,
        require: true,
        trim: true
    },
    orderstatus : {
        type : String,
        require: true,
        trim: true
    }
    }, {
    timestamps: true
})

const orderModel= mongoose.model('orders',orderSchema);
export default orderModel;