import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import Jwt from "jsonwebtoken";
import session from "express-session";
import nn from "nonce-next";
import { sendMail, isbrowser, returnMessage } from "../helpers/global.js";

export const registration= async (request,response) => {
    let data = {"pagetitle" : "Registration"};  
    let infomessages='';
    if(request.body.save_type && request.body.save_type === "_userregister_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
        } else {
            const {name,email,phone,password,confirm_password,tc} = request.body;
            let flag=1;
            if(!name || !email || !phone || !password || !confirm_password || !tc){
                flag=0;
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
            } else {
                let emailFilter = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                if(!emailFilter.test(email)){
                    flag=0;
                    infomessages += `<div class="alert alert-danger">Invalid email</div>`;
                } else if(password !== confirm_password){
                    flag=0;
                    infomessages += `<div class="alert alert-danger">Password & Confirm password does'nt match</div>`;
                } else {
                    const user = await userModel.findOne({email:email});
                    if(user){
                        flag=0;
                        infomessages += `<div class="alert alert-danger">Email already exists</div>`;
                    }
                }
            }
            if(flag){
                try {
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(password, salt);
                    const data = new userModel({
                        name: name,
                        email: email,
                        phone: phone,
                        password: hashPassword,
                        tc: tc
                    });
                    const result = await data.save();
                    if(result){
                        infomessages += `<div class="alert alert-success">Successfully registered</div>`;
                    } else {
                        infomessages += `<div class="alert alert-danger">Not registered</div>`; 
                    }            
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                }
            }
        }
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_userregister_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("frontend/register",data);
}

export const login = async (request,response) => {
    let redirect = request.query.redirect;
    let data = {"pagetitle" : "Login"};  
    let infomessages='';
    if(request.body.save_type && request.body.save_type === "_userlogin_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
        } else {
            const {email,password} = request.body;
            if(!email || !password){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
            } else {
                try {
                    const user = await userModel.findOne({email:email});
                    if(!user){
                        infomessages += `<div class="alert alert-danger">Invalid email or password</div>`;
                    } else {
                        const passMatch = await bcrypt.compare(password, user.password);
                        if(user.email === email && passMatch){
                            user.password = '';
                            request.session.user = user;
                            request.session.isUserAuthenticated = true;
                            if(redirect && redirect!= 'undefined'){
                                return response.redirect('/'+redirect); 
                            } else {
                                return response.redirect('/auth/my-account'); 
                            }
                                                       
                        } else {
                            infomessages += `<div class="alert alert-danger">Invalid email or password</div>`; 
                        }
                    }
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`; 
                }        
            }
        }
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_userlogin_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("frontend/login",data);
}

export const forgotPassword = async(request, response)=>{
    const {email} = request.body;
    if(email){
        try {
            const user = await userModel.findOne({email:email});
            if(!user){
                return response.status(400).send({"status":"failed","message": "Invalid email"});  
            } else {
                if(user.email === email){
                    const secret = user._id + process.env.JWT_SECRET_KEY;
                    const forgotToken = Jwt.sign({userId: user._id}, secret, {expiresIn: '15m'});
                    const redirectLink = `http://127.0.0.1:3000/api/user/resetpassword/${user._id}/${forgotToken}`;
                    console.log(redirectLink);
                    const checkMail = await sendMail(email,"Forgot Password",redirectLink);
                    if(checkMail){
                        return response.send({"status":"success","message": "Mail sent successfully please check your email"});
                    } else {
                        return response.status(400).send({"status":"failed","message": "Mail not sent"}); 
                    }                     
                } else {
                    return response.status(400).send({"status":"failed","message": "Invalid email"}); 
                }
            }
        } catch (error) {
            return response.status(400).send({"status":"failed","message": error.message});
        }
    } else {
        return response.status(400).send({"status":"failed","message": "Email required"});
    }
}

export const resetpassword = async (request, response) => {
    const {password, confirm_password} = request.body;
    const {id, token} = request.params;
    let flag=1;
    if(!password || !confirm_password){
        flag = 0;
        return response.status(400).send({"status":"failed","message": "Fill all required fields"}); 
    }
    else if(!id || !token){
        flag = 0;
        return response.status(400).send({"status":"failed","message": "Id or token invalid"});
    } else if(password !== confirm_password){
        flag = 0;
        return response.status(400).send({"status":"failed","message": "Password & confirm password doesn't match"});
    }
    if(flag){    
        const user = await userModel.findById(id);
        const new_token= user._id + process.env.JWT_SECRET_KEY;
        try {
            Jwt.verify(token, new_token, async (err, decoded)=>{
                if (err){
                    return response.status(500).send({"status":"failed","message": err.message});
                } else {
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(password, salt);
                    const result = await userModel.findByIdAndUpdate(user._id,{$set:{password: hashPassword}});
                    if(result){
                        return response.status(201).send({"status":"success","message": "Password reset successfully"});
                    } else {
                        return response.status(400).send({"status":"failed","message": "Not updated"});
                    }
                }
            }); 
        } catch (error) {
            return response.status(500).send({"status":"failed","message": error.message});
        }
    }
}

export const changeuserPassword = async (request, response) => {
    const {password, confirm_password} = request.body;
    let flag=1;
    if(!password || !confirm_password){
        flag=0;
        return response.status(400).send({"status":"failed","message": "Fill all required fields"}); 
    } else if(password !== confirm_password){
        flag=0;
        return response.status(400).send({"status":"failed","message": "New password & Confirm password doesn't match"});
    }
    if(flag){
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);
        try {
            const result = await userModel.findByIdAndUpdate(request.user._id,{$set:{password: hashPassword}});
            if(result){
                return response.status(201).send({"status":"success","message": "Password changed successfully"});
            } else {
                return response.status(400).send({"status":"failed","message": "Not updated"}); 
            }            
        } catch (error) {
            return response.status(400).send({"status":"failed","message": error.message}); 
        }
    }
}

export const getcurrentUser = async (request, response) => {
    try {
        return response.status(200).send({"status":"success","message": "success", "user": request.user});
    } catch (error) {
        return response.status(400).send({"status":"failed","message": error.message});
    }
}

export const logout = async (request, response) => {
    try {
        if(response.locals.isUserAuthenticated){
            request.session.destroy(function(err) {   
                if(err){
                    return response.send(err);  
                }
                return response.redirect('/auth/login');
            })   
        } else {
            return response.redirect('/auth/login');
        } 
    } catch (error) {
        return response.send("Something is wrong");
    }
}