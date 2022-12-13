import nn from "nonce-next";
import settingModel from "../../models/settingModel.js";
import {uploadFilesFunc} from "../fileuploadController.js";
import { isNumber } from "../../helpers/global.js";

export const setting = async (request, response) => {
    let data = {"pagetitle" : "Setting"};
    let infomessages='';
    let flag = 1;
    if(request.body.save_type && request.body.save_type === "_savesetting_nonce" && request.body.nonce) {
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
            flag = 0;
        } else { 
            try {
                const bodyData = request.body;
                delete bodyData.save_type;
                delete bodyData.nonce;
                let image_id = null;
                if(request.files.length > 0){
                    await uploadFilesFunc(request,response, async function(status, message){
                        if(status == "failed"){
                            infomessages += `<div class="alert alert-danger">${message}</div>`; 
                            flag = 0;
                        } else if(status == "success") {
                            image_id = message[0].path;
                        }
                    });
                    bodyData._sitelogo = image_id;
                }
                
                let result = null;
                if(flag){                        
                    Object.keys(bodyData).forEach( async (key) => {
                        const metaKey = key;
                        const meta_value = bodyData[key];
                        const chksetting = await settingModel.findOne({meta_key: metaKey});
                        if(chksetting && chksetting !== null){
                            const data = {meta_value: meta_value};
                            result = await settingModel.findOneAndUpdate({meta_key: metaKey}, data);
                        } else {
                            const data = new settingModel({
                                meta_key: metaKey,
                                meta_value: meta_value
                            });
                            result = await data.save();
                        }
                    }); 
                    return response.redirect('/admin/setting');
                    //infomessages += `<div class="alert alert-success">Successfully update</div>`;
                } else {
                    infomessages += `<div class="alert alert-danger">Not saved</div>`;
                }
            } catch (error) {
                infomessages += `<div class="alert alert-danger">${error.message}</div>`;
            }                 
        }
    }
    
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_savesetting_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;   

    try {
        let settings = await settingModel.find().exec();
        if(settings){
            data['settings'] = settings;
        }
    } catch(error){
        console.log(error.message);
    }

    return response.render("backend/setting", data);
}