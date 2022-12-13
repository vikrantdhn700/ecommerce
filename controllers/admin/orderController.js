import path from "path";
import mongoose from "mongoose";
import nn from "nonce-next";
import productModel from "../../models/productModel.js";
import orderModel from "../../models/orderModel.js";

export const orders= async (request,response) => {
    let data = {'pagetitle' : 'Orders'};
    const {q, orderid, sortby, orderby, limit, page} = request.query;
    //PAGINATION
    const limit_pg = 10;
    let page_ = parseInt(page) || 1;
    let limit_ = parseInt(limit) || limit_pg;
    let skip_ = (page_ - 1) * limit_;
    let sort = {createdAt: -1};
    if(sortby && orderby){
        const ordrbyfiled = orderby === 'desc' ? -1 : 1
        sort = {[sortby]: ordrbyfiled};
    }

    let where = {};    
    if (q) {         
        where = {   
            $or: [
                { paymentstatus: { '$regex': q, '$options': 'i' } },
                { orderstatus: { '$regex': q, '$options': 'i' } },
                { _id:  { $in: [q]} }
            ]
        } 
    }

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
            data['results'] = results;
        }        
    } catch (error) {
        console.log(error.message);
    }

    return response.render("backend/order-list",data);
};

export const singleorder = async (request, response) => {
    const {id} = request.params;
    let data = {'pagetitle' : 'Order #'+id};
    let infomessages='';
    let flag = 1;
    if(!id){
        return response.redirect('/admin/orders');
    } else {
        if(request.body.save_type && request.body.save_type === "_updatepaymentstatus_nonce" && request.body.nonce) {
            if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
                infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
                flag = 0;
            } else {
                if(flag){
                    const {paymentstatus, orderstatus} = request.body;
                    try {
                        await orderModel.findByIdAndUpdate(id, { paymentstatus: paymentstatus, orderstatus: orderstatus });
                    } catch(error){
                        console.log(error.message);
                    }
                }
            }
        }
        const retrun = await orderModel.findById(id).exec();
        if(retrun && retrun != null){
            data['result'] = retrun; 
        }
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_updatepaymentstatus_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/order-detail",data);
}