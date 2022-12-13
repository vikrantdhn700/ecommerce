import path from "path";
import session from "express-session";
import nn from "nonce-next";
import productModel from "../models/productModel.js";
import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import stripe from "stripe";

export const checkout = async(request, response) => {
    if(!response.locals.isUserAuthenticated || !response.locals.cart){
        return response.redirect('/auth/login?redirect=checkout'); 
    }
    let data = {"pagetitle" : "Checkout"};
    let nonce = nn.generate({
        scope: '_checkoutsave_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("frontend/checkout",data);
}

export const checkoutSave = async(request, response)=> {
    if(request.body.save_type && request.body.save_type === "_checkoutsave_nonce" && request.body.nonce){
        let nonce = nn.generate({
            scope: '_checkoutsave_nonce',
            expires: 3600000,
          });
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            return response.status(400).send({"status" : "failed", "message": "Fail! - Invalid nonce", "nonce" : nonce});  
        } else {
            if(!response.locals.isUserAuthenticated || !response.locals.cart){
                return response.status(400).send({"status" : "failed", "message": "Invalid user", "nonce" : nonce}); 
            }
            const { billing_firstname, billing_lastname,billing_email,billing_phone,billing_address,billing_address2,billing_country,billing_state,billing_zip,paymentMethod } = request.body;
            if(!billing_firstname || !billing_lastname || !billing_email || !billing_phone || !billing_address || !billing_country || !billing_state || !billing_zip || !paymentMethod){
                return response.status(400).send({"status" : "failed", "message": "Fill all required fields of billing", "nonce" : nonce});
            }

            if(typeof request.body.same_address == 'undefined' || request.body.same_address != 'on'){
                const { shipping_firstname, shipping_lastname,shipping_email,shipping_phone,shipping_address,shipping_address2,shipping_country,shipping_state,shipping_zip } = request.body;
                if(!shipping_firstname || !shipping_lastname || !shipping_email || !shipping_phone || !shipping_address || !shipping_country || !shipping_state || !shipping_zip){
                    return response.status(400).send({"status" : "failed", "message": "Fill all required fields of shipping", "nonce" : nonce});
                }
            }

            let emailFilter = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            var phoneFilter = /^\d{10}$/;
            if(!emailFilter.test(billing_email)){
                return response.status(400).send({"status" : "failed", "message": "Invalid billing email", "nonce" : nonce});
            }
            if(!phoneFilter.test(billing_phone)){
                return response.status(400).send({"status" : "failed", "message": "Invalid billing phone", "nonce" : nonce});
            }

            if(typeof request.body.same_address == 'undefined' || request.body.same_address != 'on'){
                if(!emailFilter.test(request.body.shipping_email)){
                    return response.status(400).send({"status" : "failed", "message": "Invalid shipping email", "nonce" : nonce});
                }
                if(!phoneFilter.test(request.body.shipping_phone)){
                    return response.status(400).send({"status" : "failed", "message": "Invalid shipping phone", "nonce" : nonce});
                }
            }

            let paymenttype = null;
            if(paymentMethod == "stripe"){
                if(typeof request.body.stripeToken == 'undefined' || !request.body.stripeToken){
                    return response.status(400).send({"status" : "failed", "message": "Invalid transaction", "nonce" : nonce});
                } else {
                    paymenttype = 'online';
                }
            } else if(paymentMethod == "cashondelivery"){
                paymenttype = 'offline';
            }

            try {
                const billing_detail = [{billing_firstname, billing_lastname, billing_email, billing_phone, billing_address, billing_address2,billing_country, billing_state, billing_zip}];
                let shipping_detail = null;
                if(typeof request.body.same_address == 'undefined' || request.body.same_address != 'on'){
                    const { shipping_firstname, shipping_lastname,shipping_email,shipping_phone,shipping_address,shipping_address2,shipping_country,shipping_state,shipping_zip } = request.body;
                    shipping_detail = [{shipping_firstname, shipping_lastname, shipping_email, shipping_phone, shipping_address, shipping_address2,shipping_country, shipping_state, shipping_zip}];

                }
                let paymentstatus = null;
                let paymentId = null;
                let customerId = null;
                if(paymentMethod == "stripe"){
                    await stripe(process.env.STRIPE_SECRET_KEY).customers.create({
                        email : billing_email,
                        description: 'Ecommerce payment',
                        source: request.body.stripeToken
                    }).then(customer => stripe(process.env.STRIPE_SECRET_KEY).charges.create({
                        amount: response.locals.cart.total * 100,
                        currency: "usd",
                        customer: customer.id
                    })).then((charge) => {
                        paymentstatus = charge.status;
                        paymentId= charge.id;
                        customerId = charge.customer;
                    });
                } else if(paymentMethod == "cashondelivery"){
                    paymentstatus = "pending";
                }
                const userId = response.locals.user._id.toString(); 
                let cart = await cartModel.findOne({user: userId});
                if(cart && cart!= null) {
                    const order = await orderModel.create({
                        user: userId,
                        cart_items: response.locals.cart.items,
                        total: response.locals.cart.total,
                        billinginfo: billing_detail,
                        shippinginfo : shipping_detail,
                        paymenttype : paymenttype,
                        paymentmethod: paymentMethod,
                        paymentstatus : paymentstatus,
                        customer_id: customerId,
                        payment_id: paymentId,
                        orderstatus: "pending"
                    })
                    if(order){
                        const data = await cartModel.deleteMany({user: userId})
                        request.session.cart = false;
                        return response.status(201).send({"status": "success","message": 'Order created successfully', "order": order._id})
                    } else {
                        return response.status(400).send({"status" : "failed", "message": "Something gone wrong", "nonce" : nonce});
                    }            
                } else {
                    return response.status(400).send({"status" : "failed", "message": "No cart found", "nonce" : nonce});
                }

            } catch (error) {
                return response.status(400).send({"status" : "failed", "message": error.message, "nonce" : nonce});
            }
        }
    }
}

export const thankYou = async (request, response)=>{
    const {id} = request.params;
    let infomessages='';
    let data = {"pagetitle" : "Thank You"};
    if(!id){
        infomessages += `<div class="alert alert-danger">Order not found</div>`;
    } else {
        const userId = response.locals.user._id.toString();
        const order = await orderModel.findOne({_id: id , user : userId }).select('total paymenttype paymentmethod paymentstatus payment_id').exec();    
        data["order"] = order;
    }    
    data["infomessages"] = infomessages;
    return response.render("frontend/thankyou",data);    
}

export const stripewebhook = async(request, response) => {
    const endpointSecret = process.env.STRIPE_SIGNING_SECRET;
    const sig = request.headers['stripe-signature'];
    let event;
    try {
        event = await stripe(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(request.body, sig, endpointSecret);
        console.log(event);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    let charge = "";
    switch (event.type) {
        case 'charge.captured':
        charge = event.data.object;
        // Then define and call a function to handle the event charge.captured
        break;
        case 'charge.failed':
        charge = event.data.object;
        // Then define and call a function to handle the event charge.failed
        break;
        case 'charge.pending':
        charge = event.data.object;
        // Then define and call a function to handle the event charge.pending
        break;
        case 'charge.refunded':
        charge = event.data.object;
        // Then define and call a function to handle the event charge.refunded
        break;
        case 'charge.succeeded':
        charge = event.data.object;
        // Then define and call a function to handle the event charge.succeeded
        break;
        // ... handle other event types
        default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
}
