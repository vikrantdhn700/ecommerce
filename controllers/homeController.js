import bcrypt from 'bcrypt';
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

export const home = async (request, response) => {
    let data = {"pagetitle" : "Home"};
    try {
        const categories = await categoryModel
                        .find()
                        .select('name slug image')
                        .populate('image','originalname path')
                        .limit(4)
                        .exec(); 
        if(categories != null && categories){
            data['categories'] = categories;
        }

        const products = await productModel
                        .find()
                        .select('title slug price image')
                        .populate('image','originalname path')
                        .limit(12)
                        .sort({createdAt: -1})
                        .exec(); 
        if(products != null && products){
            data['products'] = products;
        }

    } catch (error) {
        console.log(error.message); 
    }
    return response.render("frontend/index",data);
}