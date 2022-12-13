import bcrypt from 'bcrypt';
import session from "express-session";
import nn from "nonce-next";
import userModel from "../../models/userModel.js";
import { sendMail, genPassword, isNumber } from "../../helpers/global.js";

export const addUser= async (request,response) => {
    let data = {"pagetitle" : "Add New User"};
    let infomessages='';
    let flag = 1;
    if(request.body.save_type && request.body.save_type === "_adduser_nonce" && request.body.nonce) {
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
            flag = 0;
        } else {
            const {name,email,phone} = request.body;
            let emailFilter = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if(!name || !email || !phone){
                flag=0;
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`;
            }
            else if(!emailFilter.test(email)){
                flag=0;
                infomessages += `<div class="alert alert-danger">Invalid email address</div>`;
            } else if(await isNumber(phone) === false){
                flag=0;
                infomessages += `<div class="alert alert-danger">Invalid phone number</div>`;
            } else {
                try {
                    const user = await userModel.findOne({email:email});
                    if(user){
                        flag=0;
                        infomessages += `<div class="alert alert-danger">Email already exists</div>`;
                    }
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                }                
            }

            if(flag){
                try {
                    const password = await genPassword();
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(password, salt);
                    const data = new userModel({
                        name: name,
                        email: email,
                        phone: phone,
                        password: hashPassword,
                        tc: true
                    });
                    const result = await data.save();
                    if(result){
                        infomessages += `<div class="alert alert-success">Successfully created</div>`;
                    } else {
                        infomessages += `<div class="alert alert-danger">Not created</div>`;
                    }            
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                }
            }
        }
    }

    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_adduser_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/user-add", data);
}

export const editUser= async (request,response) => {
    let data = {"pagetitle" : "Edit User"};
    let infomessages='';
    let flag = 1;
    const id = request.params.id;
    if(!request.params || typeof id === 'undefined' || !id){
        return response.redirect('/admin/users');
    }
    if(request.body.save_type && request.body.save_type === "_edituser_nonce" && request.body.nonce) {
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
            flag = 0;
        } else {
            const {name,phone} = request.body;
            if(!name || !phone){
                flag=0;
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`;
            } else if(await isNumber(phone) === false){
                flag=0;
                infomessages += `<div class="alert alert-danger">Invalid phone number</div>`;
            } 

            if(flag){
                try {
                    const data = {
                        name: name,
                        phone: phone,
                    };
                    const result = await userModel.findOneAndUpdate({_id: id}, data);
                    if(result){
                        infomessages += `<div class="alert alert-success">Successfully updated</div>`;
                    } else {
                        infomessages += `<div class="alert alert-danger">Not updated</div>`;
                    }            
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                }
            }
        }
    }

    try {
        const retrun = await userModel.findOne({_id: id}).select('-password -tc').exec();
        if(retrun){
            data['result'] = retrun;
        } else {
            return response.redirect('/admin/users');
        }
    } catch (error) {
        return response.redirect('/admin/users');
    }

    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_edituser_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/user-edit", data);
}

export const deleteUser = async (request, response) => {
    const id = request.params.id;
    if(!request.params || typeof id === 'undefined' || !id){
        return response.send({"status":"failed","message": "Invalid"}); 
    } else {
        var retrn = await userModel.deleteOne({ _id: id });
        if(retrn){
            return response.send({"status":"success","message": "Successfully deleted"}); 
        } else {
            return response.send({"status":"failed","message": "Not deleted"});
        }
    }
}

export const fetchUsers = async (request, response) => {
    let data = {"pagetitle" : "Users"};
    let infomessages='';
    //console.log(request);
    const {q, sortby, orderby, limit, page} = request.query;    
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
        let orCond = {$or: [
            { 
                "name": {
                    $regex: q, $options: "i"
                } 
            },
            { 
                "email":  {
                    $regex: q, $options: "i"
                }  
            },
            // { 
            //     "phone":  {
            //         $regex: q, $options: "i"
            //     }  
            // }
        ]};   
        where = orCond;
    }
    // console.log(where)
    // process.exit();
    try {
        const users = await userModel
                        .find(where)
                        .select('-password -tc')                            
                        .skip(skip_).limit(limit_)
                        .sort(sort)
                        .exec();   
        const docCounts = await userModel.countDocuments(where);  
        if(users && docCounts){
            const results =[{
                        data : users,
                        limit : limit_,
                        page: page_,
                        count: users.length,
                        totalcount: docCounts,
                        pages: Math.ceil(docCounts / limit_)
                    }] ;
            data["results"] =  results;
        } else {
            infomessages += `<div class="alert alert-danger">Something is wrong</div>`; 
        }  
    } catch (error) {
        infomessages += `<div class="alert alert-danger">${error.message}</div>`; 
    }
    data["infomessages"] = infomessages;
    return response.render("backend/users-list", data);
}