import path from "path";
import session from "express-session";
import bcrypt from 'bcrypt';
import nn from "nonce-next";
import { sendMail, isNumber } from "../helpers/global.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

export const myaccount = async(request, response) => {
    let data = {"pagetitle" : "My Account"};
    let infomessages='';
    const userId = response.locals.user._id.toString();
    if(request.body.save_type && request.body.save_type === "_myaccountsave_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
        } else {
            const {name, phone} = request.body;
            if(!name || !phone){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
            } else {                
                const result = await userModel.findByIdAndUpdate(userId,{$set:{name: name, phone: phone}});
                if(result && result != null){
                    const user = await userModel.findById({_id: userId}).select('-password -tc').exec();
                    request.session.user = user;
                    infomessages += `<div class="alert alert-success">Successfully updated</div>`; 
                } else {
                    infomessages += `<div class="alert alert-danger">Sorry! not updated</div>`; 
                }
            }
        }
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_myaccountsave_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    const user = await userModel.findById({_id: userId}).select('-password -tc').exec();
    data['curruser'] = user;
    return response.render("frontend/my-account",data);
}

export const orders= async (request,response) => {
    let data = {"pagetitle" : "My Account"};
    const userId = response.locals.user._id.toString();  
    const {page} = request.query;
    //PAGINATION
    const limit_pg = 10;
    let page_ = (page && page!= null) ? parseInt(page) : 1;
    let limit_ = limit_pg;
    let skip_ = (page_ - 1) * limit_;
    let sort = {createdAt: -1};
    let where = {
            $and: [            
                {
                    user: userId
                }
            ]
        };
    //  console.log(where.$and)
    // process.exit();
    try {
        const orders = await orderModel
                        .find(where)
                        .select('total paymenttype paymentmethod paymentstatus orderstatus createdAt updatedAt')
                        .skip(skip_).limit(limit_)
                        .sort(sort)
                        .exec();   
        const docCounts = await orderModel.countDocuments(where);  
        if(orders && docCounts){
            const results =[{
                        data : orders,
                        limit : limit_,
                        page: page_,
                        count: orders.length,
                        totalcount: docCounts,
                        pages: Math.ceil(docCounts / limit_)
                    }] ;
            data['orders'] = results;
        } 
    } catch (error) {
        console.log(error.message);
    }
    return response.render("frontend/my-orders",data);
};

export const singleorder = async(request, response) => {
    const userId = response.locals.user._id.toString(); 
    const {id} = request.params;  
    let ordertitle = `Order #`+id;
    let data = {"pagetitle" : ordertitle}; 
    let infomessages=''; 
    if(!id){
        infomessages += `<div class="alert alert-danger">Invalid</div>`;
    } else {
        const retrun = await orderModel.find({_id: id, user: userId}).exec();
        if(retrun && retrun!= null){
            data['order'] = retrun; 
        } else {
            infomessages += `<div class="alert alert-danger">Invalid order id</div>`;
        }
    }    
    return response.render("frontend/order",data);
}

export const changepassword = async(request, response) => {
    let data = {"pagetitle" : "Change Password"};
    let infomessages='';
    const userId = response.locals.user._id.toString();
    if(request.body.save_type && request.body.save_type === "_myaccntchngepass_nonce" && request.body.nonce){
        let flag=1;
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
        } else {
            const {newpasssword, confirm_password} = request.body;
            if(!newpasssword || !confirm_password){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
                flag=0;
            } else if(newpasssword !== confirm_password){
                infomessages += `<div class="alert alert-danger">New Password & confirm password doesn't match</div>`;
                flag=0; 
            }
            if(flag){ 
                try {
                    const userId = response.locals.user._id.toString(); 
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(newpasssword, salt);
                    const result = await userModel.findByIdAndUpdate(userId,{$set:{password: hashPassword}});
                    if(result && result != null){
                        infomessages += `<div class="alert alert-success">Password changed successfully</div>`;
                    } else {
                        infomessages += `<div class="alert alert-danger">Sorry password not changed</div>`;
                    }
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                }
            }

        }
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_myaccntchngepass_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("frontend/my-changepassword",data);
}