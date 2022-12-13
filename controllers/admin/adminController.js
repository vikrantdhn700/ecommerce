import bcrypt from 'bcrypt';
import session from "express-session";
import nn from "nonce-next";
import adminModel from "../../models/adminModel.js";
import { sendMail } from "../../helpers/global.js";

export const login = async (request,response) => {
    let data = {};   
    let infomessages='';
    if(request.body.save_type && request.body.save_type === "_login_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
        } else {
            const {email,password} = request.body;
            if(!email || !password){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`;
            } else {
                try {
                    let admin = await adminModel.findOne({email:email});
                    if(!admin){
                        infomessages += `<div class="alert alert-danger">Invalid email or password</div>`;  
                    } else {
                        const passMatch = await bcrypt.compare(password, admin.password);
                        if(admin.email === email && passMatch){
                            admin.password = '';
                            request.session.admin = admin;
                            request.session.isAdminAuthenticated = true;
                            return response.redirect('/admin');
                        } else {
                            infomessages += `<div class="alert alert-danger">Invalid email or password</div>`; 
                        }
                    }
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`; 
                }        
            }
        }
        nn.remove(request.body.nonce);
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_login_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/login",data);
}


export const logout = async (request, response) => {
    try {
        request.session.destroy(function(err) {   
            if(err){
                return response.send(err);  
            }
            return response.redirect('/admin/auth');
        })    
    } catch (error) {
        return response.send("Something is wrong");
    }
}

