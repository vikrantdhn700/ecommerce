import express from "express";
import multer from "multer";
// Public Controller
import * as homeController from "../controllers/homeController.js";
import * as userController from "../controllers/userController.js";
import * as userproductController from "../controllers/productController.js";
import * as cartController from "../controllers/cartController.js";
import * as checkoutController from "../controllers/checkoutController.js";
import * as myaccountController from "../controllers/myaccountController.js";
// Admin Controller
import * as adminController from "../controllers/admin/adminController.js";
import * as dashboardController from "../controllers/admin/dashboardController.js";
import * as categoryController from "../controllers/admin/categoryController.js";
import * as productController from "../controllers/admin/productController.js";
import * as adminorderController from "../controllers/admin/orderController.js";
import * as adminuserController from "../controllers/admin/userController.js";
import * as settingController from "../controllers/admin/settingController.js";
// Middleware
import { isAdminAuth, isUserAuth } from "../middlewares/authMiddleware.js";
import { uploadFiles } from "../middlewares/uploadFilesMiddleware.js";

const router= express.Router();
async function uploadFileMidwre (request, response, next) {
  uploadFiles(request, response, async function (err) {
    if (err instanceof multer.MulterError) {
      return `<div class="alert alert-danger">${err.message}</div>`;
    } else if (err) {
      return `<div class="alert alert-danger">${err.message}</div>`;
    } else {
      next();
    }
  })
}

/*************** Public Routes ***************/
router.get('/',homeController.home);
// User Auth
router.get('/auth/login',userController.login);
router.post('/auth/login',userController.login);
router.get('/auth/register',userController.registration);
router.post('/auth/register',userController.registration);
router.get('/auth/logout',userController.logout);
// Product Pages
router.get('/categories',userproductController.categories);
router.get('/category/:slug',userproductController.categoryProducts);
router.get('/product/detail/:slug',userproductController.singleProduct);
router.get('/products',userproductController.Products);
// Cart
router.get('/cart',cartController.viewCart);
router.post('/cart/add',cartController.addToCart);
router.post('/cart/update',cartController.updateCart);
router.post('/cart/delete',cartController.deleteCart);
// Checkout
router.get('/checkout',checkoutController.checkout);
router.post('/checkout',checkoutController.checkoutSave);
router.get('/order/thankyou/:id',isUserAuth,checkoutController.thankYou);
router.post('/order/stripewebhook',express.raw({type: 'application/json'}),checkoutController.stripewebhook);
router.get('/auth/my-account/',isUserAuth,myaccountController.myaccount);
router.post('/auth/my-account/',isUserAuth,myaccountController.myaccount);
router.get('/auth/orders/',isUserAuth,myaccountController.orders);
router.get('/auth/order/:id',isUserAuth,myaccountController.singleorder);
router.get('/auth/changepassword/',isUserAuth,myaccountController.changepassword);
router.post('/auth/changepassword/',isUserAuth,myaccountController.changepassword);
/*************** Admin Backend ***************/
// Auth Pages
router.get('/admin/auth',adminController.login);
router.post('/admin/auth',adminController.login);
router.get('/admin/auth/logout',isAdminAuth, adminController.logout);
// Dashboard
router.get('/admin',isAdminAuth,dashboardController.dashboard);
// Categories
router.get('/admin/categories', isAdminAuth, categoryController.fetchCategories);
router.get('/admin/category/add', isAdminAuth, categoryController.addCategory);
router.post('/admin/category/add', [uploadFileMidwre, isAdminAuth], categoryController.addCategory);
router.get('/admin/category/edit/:id', isAdminAuth, categoryController.updateCategory);
router.post('/admin/category/edit/:id', [uploadFileMidwre, isAdminAuth], categoryController.updateCategory);
router.delete('/admin/category/image/delete/:id/:image', isAdminAuth, categoryController.deleteCategoryimage);
router.delete('/admin/category/delete/:id', isAdminAuth, categoryController.deleteCategory);
// Products
router.get('/admin/products', isAdminAuth, productController.fetchProducts);
router.get('/admin/product/add', isAdminAuth, productController.addProduct);
router.post('/admin/product/add', [uploadFileMidwre, isAdminAuth], productController.addProduct);
router.get('/admin/product/edit/:id', isAdminAuth, productController.updateProduct);
router.get('/admin/product/:id', isAdminAuth, productController.singleProduct);
router.post('/admin/product/edit/:id', [uploadFileMidwre, isAdminAuth], productController.updateProduct);
router.delete('/admin/product/delete/:id', isAdminAuth, productController.deleteProduct);
router.delete('/admin/product/image/delete/:id/:image', isAdminAuth, productController.deleteProductimage);
// Orders
router.get('/admin/orders', isAdminAuth, adminorderController.orders);
router.get('/admin/order/:id', isAdminAuth, adminorderController.singleorder);
router.post('/admin/order/:id', isAdminAuth, adminorderController.singleorder);
// Users
router.get('/admin/users', isAdminAuth, adminuserController.fetchUsers);
router.get('/admin/user/add', isAdminAuth, adminuserController.addUser);
router.post('/admin/user/add', isAdminAuth, adminuserController.addUser);
router.get('/admin/user/edit/:id', isAdminAuth, adminuserController.editUser);
router.post('/admin/user/edit/:id', isAdminAuth, adminuserController.editUser);
router.delete('/admin/user/delete/:id', isAdminAuth, adminuserController.deleteUser);
// Setting
router.get('/admin/setting', isAdminAuth, settingController.setting);
router.post('/admin/setting', [uploadFileMidwre, isAdminAuth], settingController.setting);

export default router;