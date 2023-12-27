import path from "path";
import session from "express-session";
import productModel from "../models/productModel.js";
import fileModel from "../models/fileModel.js";
import cartModel from "../models/cartModel.js";

export const getUserCart= async (request,response) => {
    const userId = response.locals.user._id.toString();  
    try {
      const cart = await cartModel.findOne({ user: userId });
      if (cart && cart.cart_items.length > 0) {
        return cart.cart_items;
      } else {
        return false;
      }
    } catch (error) {
        return error.message;
    }
};

export const deleteCart= async (request,response) => {
    //const userId = request.user._id.toString();
    const product_id = request.body.product_id;
    if(!product_id){
      return response.status(404).send({"status" : "failed", "message": "Invalid product id"});
    }
    try {
      //let cart = await cartModel.findOne({ user: userId });  
      let cart = request.session.cart;
      const itemIndex = cart.items.findIndex((item) => item.product_id == product_id);      
      if (itemIndex > -1) {
        let item = cart.items[itemIndex];
        if(item.price && !item.price.$numberDecimal) { 
          var price = item.price; 
        } else if(item.price.$numberDecimal){ 
          var price = item.price.$numberDecimal; 
        }
        cart.total -= item.quantity * price;
        if(cart.total < 0) {
            cart.total = 0
        } 
        cart.items.splice(itemIndex, 1);
        cart.total = cart.items.reduce((acc, curr) => {
                        if(curr.price && !curr.price.$numberDecimal) { 
                          var price = curr.price; 
                        } else if(curr.price.$numberDecimal){ 
                          var price = curr.price.$numberDecimal; 
                        }
                        return acc + curr.quantity * price;
                    },0)
        request.session.cart = cart;
        if(response.locals.isUserAuthenticated){
          await saveCartToUser(request,response);
        }
        return response.status(200).send({"status" : "success", "message": "Success", "result": cart});
      } else {
        return response.status(404).send({"status" : "failed", "message": "item not found"});
      }
    } catch (error) {
      return response.status(400).send({"status" : "failed", "message": error.message});
    }
};

export const viewCart = async (request, response) => {
  let data = {"pagetitle" : "Cart"};
  return response.render("frontend/cart",data);
}

export const saveCartToUser = async (request, response) => {
  if(response.locals.isUserAuthenticated && request.session.cart){
    const userId = response.locals.user._id.toString();
    const cartUser = await cartModel.findOne({ user : userId });
    const cartItems = JSON.stringify(request.session.cart);
    console.log("Update Before 1")
    if(cartUser != null && cartUser){
      console.log("Update Before")
      await cartModel.findOneAndUpdate({ user : userId }, {cart_items : cartItems});
      console.log("Update After")
    } else {
      await cartModel.create({
        user : userId,
        cart_items : cartItems
      });
    }   
  } 
}

export const addToCart = async (request,response) => {   
      const { product_id, qty } = request.body;
      if(!product_id || !qty){
        return response.status(404).send({"status" : "failed", "message": "Invalid product id Or Quantity"});
      }
      try { 
        let cart = null;   
        if(request.session.isUserAuthenticated){ 
          const userId = response.locals.user._id.toString();
          const getcart = await cartModel.findOne({ user: userId });
          if (getcart && getcart.cart_items.length > 0) {
            cart = JSON.parse(getcart.cart_items);
          } else {
            cart = request.session.cart;
          }
        } else {
          cart = request.session.cart;
        }
        
        const product = await productModel.findOne({ _id: product_id }).populate('image','path').exec();
        if (!product) {
            return response.status(404).send({"status" : "error", "message": "product not found"});
        }
        if(qty <= 0){
          qty = 1;
        }
        const price = product.price;
        const name = product.title;
        const quantity = parseInt(qty);
        const image = product.image.path;
        const slug = product.slug;
        //If cart already exists for user,
        if (cart) {
            const itemIndex = cart.items.findIndex((item) => item.product_id ==  product_id);
            //check if product exists or not
            if (itemIndex > -1) {
                let productCart = cart.items[itemIndex];
                productCart.quantity += quantity;
                productCart.image = image;
                productCart.slug = slug;
                cart.total = cart.items.reduce((acc, curr) => {
                  if(curr.price && !curr.price.$numberDecimal) { 
                    var price = curr.price; 
                  } else if(curr.price.$numberDecimal){ 
                    var price = curr.price.$numberDecimal; 
                  }
                  return acc + curr.quantity * price;
                },0)
                cart.items[itemIndex] = productCart;
                request.session.cart = cart;
                if(response.locals.isUserAuthenticated){
                  await saveCartToUser(request,response);
                }
                return response.status(200).send({"status" : "success", "message": "Added to cart", "result": cart});
            } else {
                cart.items.push({ product_id, image, slug, name, quantity, price });
                cart.total = cart.items.reduce((acc, curr) => {
                                if(curr.price && !curr.price.$numberDecimal) { 
                                  var price = curr.price; 
                                } else if(curr.price.$numberDecimal){ 
                                  var price = curr.price.$numberDecimal; 
                                }
                                return acc + curr.quantity * price;
                            },0)
                request.session.cart = cart;
                if(response.locals.isUserAuthenticated){
                  await saveCartToUser(request,response);
                }
                return response.status(200).send({"status" : "success", "message": "Added to cart", "result": cart});
            }
        } else {
            //no cart exists, create one
            const newCart = {
                    items: [{ product_id, image, slug, name, quantity, price }],
                    total: quantity * price,
                };
            request.session.cart = newCart;
            if(response.locals.isUserAuthenticated){
              await saveCartToUser(request,response);
            }
            return response.status(201).send({"status" : "success", "message": "Added to cart", "result": newCart});
        }
        
      } catch (error) {
          return response.status(500).send({"status" : "failed", "message": "Error: "+error.message});
      }
}

export const updateCart = async (request, response) => {
  let returnCons = "";
  const { product_id, qty } = request.body;
  if(!qty || !product_id){
    return response.status(404).send({"status" : "failed", "message": "Invalid product id Or Quantity"});
  }
  try {
    const qtyArray = qty.split(",");
    const productIdArray = product_id.split(",");
    //returnCons += "QTY " + qtyArray +" ProductArr - "+ productIdArray
    if(productIdArray != null && productIdArray){      
      let cart = null;   
      if(request.session.isUserAuthenticated){ 
        const userId = response.locals.user._id.toString();
        const getcart = await cartModel.findOne({ user: userId });
        if (getcart && getcart.cart_items.length > 0) {
          cart = JSON.parse(getcart.cart_items);
        } else {
          cart = request.session.cart;
        }
      } else {
        cart = request.session.cart;
      }
      //returnCons += "Cart " + cart
      //let product = await productModel.findById('63466845c7658d8456a18807').select('-admin_id').populate('image','originalname path').exec();
      //returnCons += "Product " + product

      let counter = 1;
      productIdArray.forEach(async function(productId, index){ 
        let product = await productModel.findById(productId).select('-admin_id').populate('image','originalname path').exec();
        //returnCons += "Product " + product
        return response.status(201).send({"status" : "error", "message": product});

        if (!product || product == null || product == undefined) {
            return response.status(404).send({"status" : "error", "message": "product not found"});
        }
        const qty = qtyArray[index];
        if(qty <= 0){
          qty = 1;
        }        
        const price = product.price;
        const name = product.title;        
        const quantity = parseInt(qty);
        const image = product.image.path;
        const slug = product.slug;        
        if (cart) {
          const itemIndex = cart.items.findIndex((item) => item.product_id ==  productId);         
          if (itemIndex > -1) {
              let productCart = cart.items[itemIndex];
              productCart.quantity = quantity;
              productCart.image = image;
              productCart.slug = slug;
              returnCons += "BEfore REduce " + product
              cart.total = cart.items.reduce((acc, curr) => {
                if(curr.price && !curr.price.$numberDecimal) { 
                  var price = curr.price; 
                } else if(curr.price.$numberDecimal){ 
                  var price = curr.price.$numberDecimal; 
                }
                return acc + curr.quantity * price;
              },0)
              returnCons += "After Reduce " + cart.total
              cart.items[itemIndex] = productCart;
              returnCons += "BEFORE counter " + cart.items.length +" "+ counter
              if(cart.items.length == counter){
                const newCart = cart;
                request.session.cart = newCart;
                if(response.locals.isUserAuthenticated){
                  await saveCartToUser(request,response);
                }
              }   
              counter++;           
          }
        }
      })      
      return response.status(201).send({"status" : "success", "message": "Cart updated", "result": cart});
      //return response.status(201).send({"status" : "success", "message": "Cart updated", "result": returnCons});
    }
  } catch (error) {
    console.log(error.message);
  }
}
