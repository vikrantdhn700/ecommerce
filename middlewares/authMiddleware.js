import Jwt  from "jsonwebtoken";
import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";

export const checkuserLoggedIn = async (request, response, next) => {
    let token;
    const { authorization } = request.headers;
    if(authorization && authorization.startsWith('Bearer')){
        try {
            token = authorization.split(' ')[1];
            if(token){
                Jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded)=>{
                    if (err){
                        return response.status(500).send({"status":"failed","message": err.message});
                    } else {
                        const userId = decoded.userId;
                        const getUser =  await userModel.findById(userId).select('-password -tc')
                        if(getUser && getUser.token === token){
                            request.user = getUser;
                            next();
                        } else {
                            return response.status(401).send({"status":"failed","message": "Invalid token"}); 
                        }
                    }
                });                
            } else {
                return response.status(401).send({"status":"failed","message": "Invalid token"}); 
            }            
        } catch (error) {
            return response.status(401).send({"status":"failed","message": error.message});
        }
    } else {
        return response.status(401).send({"status":"failed","message": "Unauthorized user"}); 
    }
}


export const isAdminAuth = async (request, response, next) => {
    if(request.session.isAdminAuthenticated){       
        next();
    } else {
        return response.redirect('/admin/auth');
    }
}

export const isUserAuth = async (request, response, next) => {
    if(request.session.isUserAuthenticated){       
        next();
    } else {
        return response.redirect('/auth/login');
    }
}


