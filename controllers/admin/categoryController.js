import path from "path";
import nn from "nonce-next";
import fse from "fs-extra";
import categoryModel from "../../models/categoryModel.js";
import fileModel from "../../models/fileModel.js";
import {uploadFilesFunc} from "../fileuploadController.js";

export const addCategory= async (request,response) => {
    let data = {"pagetitle" : "Add New Category"};
    let infomessages='';
    let flag = 1;
    if(request.body.save_type && request.body.save_type === "_addcategory_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
            flag = 0;
        } else {            
            const {name , description} = request.body;
            if(!name){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`;
                flag = 0;
            } else {
                try {   
                    let image_id = null;
                    if(request.files.length > 0){
                        await uploadFilesFunc(request,response, async function(status, message){
                            if(status == "failed"){
                                infomessages += `<div class="alert alert-danger">${message}</div>`; 
                                flag = 0;
                            } else if(status == "success") {
                                image_id = message[0].id;
                            }
                        });
                    } 
                    if(flag){
                        const data = new categoryModel({
                                        name: name,
                                        description: description,
                                        image: image_id
                                    });
                        await data.save();
                        infomessages += `<div class="alert alert-success">Successfully created</div>`;
                    }
                } catch (error) {
                    infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                    flag = 0;
                }
            }
        }
    }    

    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_addcategory_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/category-add", data);
}

export const updateCategory = async (request, response) => {
    let data = {"pagetitle" : "Edit Category"};
    let infomessages='';
    let flag = 1;
    const id = request.params.id;
    if(!request.params || typeof id === 'undefined' || !id){
        return response.redirect('/admin/categories');
    } else {
        if(request.body.save_type && request.body.save_type === "_updatecategory_nonce" && request.body.nonce) {
            if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
                infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
                flag = 0;
            } 
            const {name,description} = request.body;
            if(!name){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
                flag = 0;
            } 

            try {
                if(flag){
                    let data = {
                        name: name,
                        description: description
                    };

                    let image_id = null;
                    if(request.files.length > 0) {
                        await uploadFilesFunc(request,response, async function(status, message){
                            if(status == "failed"){
                                infomessages += `<div class="alert alert-danger">${message}</div>`; 
                                flag = 0;
                            } else if(status == "success") {
                                image_id = message[0].id;
                            }
                        });
                    }
                    if(image_id != null){
                        data.image = image_id;
                    }
                    
                    const res = await categoryModel.findOneAndUpdate({_id: id}, data);
                    if(res){
                        infomessages += `<div class="alert alert-success">Successfully updated</div>`; 
                    } else {
                        infomessages += `<div class="alert alert-danger">Not Updated</div>`;
                    }
                }
            } catch (error) {
                infomessages += `<div class="alert alert-danger">${error.message}</div>`;
                flag = 0;
            }
        }
        try {
            const retrun = await categoryModel.findOne({_id: id}).populate('image','originalname path').exec();
            if(retrun){
                data['result'] = retrun;
            } else {
                return response.redirect('/admin/categories');
            }
        } catch (error) {
            return response.redirect('/admin/categories');
        }        
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_updatecategory_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/category-edit", data);
}

export const deleteCategory = async (request, response) => {
    const id = request.params.id;
    if(!id){
        return response.send({"status":"failed","message": "Invalid"}); 
    } else {
        var retrn = await categoryModel.deleteOne({ _id: id });
        if(retrn){
            return response.send({"status":"success","message": "Successfully deleted"}); 
        } else {
            return response.send({"status":"failed","message": "Not deleted"});
        }
    }
}

export const deleteCategoryimage = async (request, response) => {
    const id = request.params.id;
    const image = request.params.image;
    if(!id || !image){
        return response.send({"status":"failed","message": "Invalid"}); 
    } else {
        try {
            const getImageDetail = await fileModel.findById(image).select('filename destination').exec();
            if(getImageDetail){
                let deletePath = getImageDetail.destination+'/'+getImageDetail.filename;
                fse.removeSync(deletePath, err => {
                    if (err) return response.send({"status":"failed","message": err.message}); 
                });
                const rtrn = await fileModel.deleteOne({ _id: image })
                if(rtrn){
                    let data = {image: null};
                    await categoryModel.findOneAndUpdate({_id: id}, data);
                    return response.send({"status":"success","message": "Successfully deleted"});
                } else {
                    return response.send({"status":"failed","message": "Not deleted"});
                }          
            }
        } catch (error) {
            return response.send({"status":"failed","message": error.message});
        }
    }
}


export const fetchCategories = async (request, response) => {
    let data = {"pagetitle" : "Categories"};
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

    try {
        const categories = await categoryModel
                        .find()
                        .select()                            
                        .populate('image','originalname path')
                        .skip(skip_).limit(limit_)
                        .sort(sort)
                        .exec();   
        const docCounts = await categoryModel.countDocuments();  
        if(categories && docCounts){
            const results =[{
                        data : categories,
                        limit : limit_,
                        page: page_,
                        count: categories.length,
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
    //console.log(request);
    return response.render("backend/category-list", data);
}