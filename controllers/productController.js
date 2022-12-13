import path from "path";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import { getCatidBySlug, getProductBySlug } from "../helpers/global.js";


export const categories = async (request, response) => {
    let data = {"pagetitle" : "Categories"};
    try {
        const categories = await categoryModel
                        .find()
                        .select('name slug image')
                        .populate('image','originalname path')
                        .exec(); 
        if(categories != null && categories){
            data['categories'] = categories;
        }

    } catch (error) {
        console.log(error.message); 
    }
    return response.render("frontend/categories",data);
}

export const categoryProducts = async (request, response) => {
    let data = {"pagetitle" : "Categories"};
    const {slug} = request.params;
    if(slug == null || !slug){
        return response.redirect('/categories');
    }
    try {      
        const catId = await getCatidBySlug(slug);
        if(catId == false || catId == null){
            return response.redirect('/categories');
        }
        const currCategory = await categoryModel.findOne({_id: catId});
        if(currCategory != null && currCategory){
            data['currcategory']= currCategory;
        }
        //console.log(catId);
        const categories = await categoryModel
                        .find({ _id: { $ne: catId }})
                        .select('name slug')
                        .exec(); 
        if(categories != null && categories){
            data['categories'] = categories;
        }
        
        const productMaxMinPrice = await productModel.aggregate([
            {
                $match: { category: ObjectId(catId) }
            },
            {
              $group:
              {
                _id: null,
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
              }
            }
          ]);
        if(productMaxMinPrice != null && productMaxMinPrice){
            data["minMaxPrice"]= productMaxMinPrice; 
        }        

        let attr = request.query;
        attr.cat = catId; 
        //console.log(attr);
        const products = await fetchProducts(attr);
        if(products != null && products){
            data["products"]= products;
        }                
    } catch (error) {
        console.log(error.message); 
    }
    return response.render("frontend/category-products",data);
}

export const Products = async (request, response) => {
    let data = {"pagetitle" : "Products"};    
    try {     
        //console.log(catId);
        const categories = await categoryModel
                        .find()
                        .select('name slug')
                        .exec(); 
        if(categories != null && categories){
            data['categories'] = categories;
        }
        
        const productMaxMinPrice = await productModel.aggregate([
            {
              $group:
              {
                _id: null,
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
              }
            }
          ]);
        if(productMaxMinPrice != null && productMaxMinPrice){
            data["minMaxPrice"]= productMaxMinPrice; 
        }        

        let attr = request.query;
        //console.log(attr);
        const products = await fetchProducts(attr);
        if(products != null && products){
            data["products"]= products;
        }                
    } catch (error) {
        console.log(error.message); 
    }
    return response.render("frontend/product-list",data);
}

export const singleProduct = async (request, response) => {
    let data = {"pagetitle" : ""};
    const {slug} = request.params;
    if(slug == null || !slug){
        return response.redirect('/products');
    } 
    try {
        const productId = await getProductBySlug(slug);
        if(productId == false || productId == null){
            return response.redirect('/products');
        }
        const currProduct = await productModel.findOne({_id: productId})
                            .select('-admin_id')
                            .populate('image','originalname path')
                            .populate('category','name slug')
                            .exec();
        if(currProduct != null && currProduct){
            data["pagetitle"] = currProduct.title;
            data['product']= currProduct;            
        } else {
            return response.redirect('/products');
        }
        const relatedProduct = await productModel.find({
                                        $and : [
                                            { category: currProduct.category._id.toString() },
                                            { _id: { $ne: productId } },
                                        ]
                                    })
                                .select('title slug price')
                                .populate('image','originalname path')
                                .exec();
        if(relatedProduct != null && relatedProduct){
            data["relatedProduct"] = relatedProduct;
        }
    } catch (error) {
        //console.log(error.message);
        return response.redirect('/products');
    }
    
    return response.render("frontend/product-detail",data);
} 

const fetchProducts = async (attr) => {
    //console.log(attr);
    const {q, sortby, orderby, page, pricefrom, priceto, cat} = attr; 
    //PAGINATION
    const limit_pg = 12;
    let page_ = (parseInt(page)) ? parseInt(page) : 1;
    let limit_ = limit_pg;
    let skip_ = (page_ - 1) * limit_;
    let sort = {createdAt: -1};
    if(sortby && orderby){
        const ordrbyfiled = orderby === 'desc' ? -1 : 1
        sort = {[sortby]: ordrbyfiled};
    }

    let where = {
            $and: [

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
            return {"status":"success","message": "Successfully fetched", "results" : results}; 
        } else {
            return {"status":"failed","message": "No product found"};
        }  
    } catch (error) {
        return {"status":"failed","message": error.message};
    }
    
}
 