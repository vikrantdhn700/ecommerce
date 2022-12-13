import path from "path";
import nn from "nonce-next";
import fse from "fs-extra";
import fileModel from "../../models/fileModel.js";
import { isNumber } from "../../helpers/global.js";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import {uploadFilesFunc} from "../fileuploadController.js";

export const addProduct= async (request,response) => {
    let data = {"pagetitle" : "Add New Product"};
    let infomessages='';
    let flag = 1;
    if(request.body.save_type && request.body.save_type === "_addproduct_nonce" && request.body.nonce){
        if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
            infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
            flag = 0;
        } else {            
            const {title,description,price,category} = request.body;
            if(!title || !description || !price || !category){
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

                    let checkIsNumber = await isNumber(price);
                    if(checkIsNumber === false){
                        infomessages += `<div class="alert alert-danger">Price must be a deciaml number</div>`;
                        flag = 0;
                    } 
                    if(flag){
                        const adminid = request.session.admin._id.toString();
                        const data = new productModel({
                                        admin_id: adminid,
                                        title: title,
                                        description: description,
                                        price: price,
                                        category: category,
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

    try {
        const categories = await categoryModel
                        .find()
                        .select('name')
                        .exec(); 
        if(categories){
            data['categories'] = categories;
        }
    } catch (error) {
        infomessages += `<div class="alert alert-danger">${error.message}</div>`;
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_addproduct_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/product-add", data);
}

export const updateProduct = async (request, response) => {
    let data = {"pagetitle" : "Edit Product"};
    let infomessages='';
    let flag = 1;
    const id = request.params.id;
    if(!request.params || typeof id === 'undefined' || !id){
        return response.redirect('/admin/products');
    } else {
        const adminid = request.session.admin._id.toString();
        if(request.body.save_type && request.body.save_type === "_updateproduct_nonce" && request.body.nonce) {
            if(!nn.peekCompare(request.body.nonce, request.body.save_type)) {
                infomessages += `<div class="alert alert-danger">Fail! - Invalid nonce</div>`; 
                flag = 0;
            } 
            const {title,description,price, category} = request.body;
            if(!title || !description || !price || !category){
                infomessages += `<div class="alert alert-danger">Fill all required fields</div>`; 
                flag = 0;
            }
            let checkIsNumber = await isNumber(price);
            if(checkIsNumber === false){
                infomessages += `<div class="alert alert-danger">Price must be a deciaml number</div>`; 
                flag = 0;
            } 

            try {
                if(flag){
                    let data = {
                        title: title,
                        description: description,
                        price: price,
                        category: category
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
                    
                    const res = await productModel.findOneAndUpdate({admin_id: adminid, _id: id}, data);
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
            const retrun = await productModel.findOne({_id: id, admin_id : adminid}).populate('image','originalname path').exec();
            if(retrun){
                data['result'] = retrun;
            } else {
                return response.redirect('/admin/products');
            }
            const categories = await categoryModel
                        .find()
                        .select('name')
                        .exec(); 
            if(categories){
                data['categories'] = categories;
            }
        } catch (error) {
            return response.redirect('/admin/products');
        }        
    }
    data["infomessages"] = infomessages;
    let nonce = nn.generate({
        scope: '_updateproduct_nonce',
        expires: 3600000,
      });
    data['nonce'] = nonce;
    return response.render("backend/product-edit", data);
}

export const singleProduct = async (request, response) => {
    let data = {"pagetitle" : "Product Detail"};
    const {id} = request.params;
    if(id == null || !id){
        return response.redirect('/admin/products');
    } else {
        const adminid = request.session.admin._id.toString();
        const retrun = await productModel.findOne({_id: id, admin_id : adminid}).select('-admin_id').populate('image','originalname path').exec();
        if(retrun){
            data['result'] = retrun;
        } else {
            return response.redirect('/admin/products');
        }
    }
    return response.render("backend/product-detail", data);
} 

export const deleteProduct = async (request, response) => {
    const id = request.params.id;
    if(!id){
        return response.send({"status":"failed","message": "Invalid"}); 
    } else {
        var retrn = await productModel.deleteOne({ _id: id });
        if(retrn){
            return response.send({"status":"success","message": "Successfully deleted"}); 
        } else {
            return response.send({"status":"failed","message": "Not deleted"});
        }
    }
}

export const deleteProductimage = async (request, response) => {
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
                    const adminid = request.session.admin._id.toString();
                    await productModel.findOneAndUpdate({admin_id: adminid, _id: id}, data);
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

export const fetchProducts = async (request, response) => {
    let data = {"pagetitle" : "Products"};
    let infomessages='';
    //console.log(request);
    const adminid = request.session.admin._id.toString();      
    //console.log(request.query); 
    const {q, sortby, orderby, limit, page, pricefrom, priceto, cat} = request.query;
    if(!adminid){
        infomessages += `<div class="alert alert-danger">Invalid administrator</div>`; 
    }
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

    let where = {
            $and: [            
                {
                    admin_id: adminid
                }
            ]
        }; 

    let prcFrm = (pricefrom && pricefrom != '') ? pricefrom : 0;
    let priceFilter = { $and: [ { price: { $gte : prcFrm } } ] };
    if(priceto && priceto != '' && parseInt(priceto) > 0){
        priceFilter = { $and: [ { price: { $gte : prcFrm } }, { price : { $lte : priceto } } ] };  
    }
    if(typeof cat!= 'undefined' && cat!=''){
        let catFilter = { category: cat };
        where.$and.push(catFilter);
    }

    where.$and.push(priceFilter);

    if (q) {  
        let orCond = {$or: [
            { 
                "title": {
                    $regex: q, $options: "i"
                } 
            },
            { 
                "description":  {
                    $regex: q, $options: "i"
                }  
            }
        ]};   
        where.$and.push(orCond);
    }
    // console.log(where)
    // process.exit();
    try {
        const categories = await categoryModel
                        .find()
                        .select('name')
                        .exec(); 
        if(categories){
            data['categories'] = categories;
        }

        const products = await productModel
                        .find(where)
                        .select('-admin_id -description')                            
                        .populate('image','originalname path')
                        .skip(skip_).limit(limit_)
                        .sort(sort)
                        .exec();   
        const docCounts = await productModel.countDocuments(where);  
        if(products && docCounts){
            const results =[{
                        data : products,
                        limit : limit_,
                        page: page_,
                        count: products.length,
                        totalcount: docCounts,
                        pages: Math.ceil(docCounts / limit_)
                    }] ;
            data["results"] =  results;
            //console.log(data["results"][0].data);
            //process.exit();
        } else {
            infomessages += `<div class="alert alert-danger">Something is wrong</div>`; 
        }  
    } catch (error) {
        infomessages += `<div class="alert alert-danger">${error.message}</div>`; 
    }
    data["infomessages"] = infomessages;
    //console.log(request);
    return response.render("backend/product-list", data);
}