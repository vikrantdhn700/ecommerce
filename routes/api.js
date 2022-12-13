import express from "express";
import multer from "multer";
import * as userController from "../controllers/userController.js";
import * as userproductController from "../controllers/productController.js";
import * as cartController from "../controllers/cartController.js";
import * as orderController from "../controllers/orderController.js";
import * as adminController from "../controllers/admin/adminController.js";
import {uploadFilesFunc} from "../controllers/fileuploadController.js";
import * as productController from "../controllers/admin/productController.js";
import * as adminorderController from "../controllers/admin/orderController.js";
import { checkuserLoggedIn, checkadminLoggedIn } from "../middlewares/authMiddleware.js";
import { uploadFiles } from "../middlewares/uploadFilesMiddleware.js";

const router= express.Router();

// Public Routes
router.post('/user/registration',userController.registration);
router.post('/user/login',userController.login);
router.post('/user/forgot-password',userController.forgotPassword);
router.post('/user/resetpassword/:id/:token',userController.resetpassword);

// Logged in user
router.post('/user/change-password', checkuserLoggedIn, userController.changeuserPassword);
router.get('/user/getcurrent-user', checkuserLoggedIn, userController.getcurrentUser);
router.post('/user/logout', checkuserLoggedIn, userController.logout);
router.get('/products',checkuserLoggedIn,userproductController.fetchProducts);
router.get('/product/:id',checkuserLoggedIn,userproductController.singleProduct);
router.get('/cart', checkuserLoggedIn, cartController.getCart);
router.post('/cart/add',checkuserLoggedIn,cartController.addToCart);
router.delete('/cart/delete/:id', checkuserLoggedIn, cartController.deleteCart);
router.post('/order/checkout',checkuserLoggedIn,orderController.checkout);
router.get('/orders',checkuserLoggedIn,orderController.getOrders);
router.get('/order/:id',checkuserLoggedIn,orderController.singleorder);

// Admin Public Routes
router.post('/admin/registration',adminController.registration);
router.post('/admin/login',adminController.login);

// Logged in Admin 
router.post('/admin/logout', checkadminLoggedIn, adminController.logout);
router.get('/admin/getcurrent-admin', checkadminLoggedIn, adminController.getcurrentAdmin);
router.post('/admin/product/add',checkadminLoggedIn,productController.addProduct);
router.get('/admin/product/edit/:id',checkadminLoggedIn,productController.editProduct);
router.patch('/admin/product/update/:id',checkadminLoggedIn,productController.updateProduct);
router.delete('/admin/product/delete/:id',checkadminLoggedIn,productController.deleteProduct);
router.get('/admin/products',checkadminLoggedIn,productController.fetchProducts);
router.get('/admin/product/:id',productController.singleProduct);
router.get('/admin/orders',checkadminLoggedIn,adminorderController.getOrders); 
router.get('/admin/order/:id',checkadminLoggedIn,adminorderController.singleorder); 
// File Upload
router.post('/upload/files', async function (request, response, next) {
    uploadFiles(request, response, async function (err) {
      if (err instanceof multer.MulterError) {
        return response.status(400).send({ "status": "failed", "message": err.message }); 
      } else if (err) {
        return response.status(400).send({ "status": "failed", "message": err.message }); 
      } else {
        next();
      }
    })
}, uploadFilesFunc);


export default router;