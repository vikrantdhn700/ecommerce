import nodemailer from 'nodemailer';
import adminModel from "../models/adminModel.js";
import settingModel from "../models/settingModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

export const sendMail = async (to, subject, message) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: '"Vikrant Kumar" <'+process.env.FROM_MAIL+'>',
    to: to,
    subject: subject,
    html: message,
  });
  if(info){
    return json({"status":"success","message":info.messageId});
  } else {
    return json({"status":"failed","message": "Mail not sent"});
  }
}

export async function isNumber(n) { 
  return /^-?[\d.]+(?:e-?\d+)?$/.test(n); 
} 

export const isbrowser =  async (request) => {
  const usrAgent = request.useragent;
  if(usrAgent.isOpera || usrAgent.isIE || usrAgent.isEdge || usrAgent.isSafari || usrAgent.isFirefox || usrAgent.isChrome || usrAgent.isOmniWeb || usrAgent.isSeaMonkey
    ){
      return true;
    } else {
      return false;
    }
}

export async function returnMessage(request, response, statusCode, status, message, additional){
  const chkBrowser = await isbrowser(request);
  let returnJson = {"status":status,"message": message};
  if(additional){
    returnJson = {...returnJson,...additional}
  }
  if(chkBrowser){
    return JSON.stringify(returnJson); 
  } else {
    return response.status(statusCode).send(returnJson); 
  } 
}

export async function genPassword() {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 10;
  var password = "";
  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber +1);
  }
  return password;
}

export const getSetting = async (meta_key)=> {
  try {
    let settings = await settingModel.findOne({meta_key: meta_key}).select('meta_value');
    if(settings && settings !== null){
      return settings.meta_value;
    } else {
      return false;
    }
  } catch(error){
    console.log(error.message);
  }
} 

export async function getCatidBySlug(slug) {
  if(typeof slug == 'undefined' || slug==''){
    return false;
  }
  try {
    let category = await categoryModel.findOne({slug: slug}).select('_id');
    if(category || category != null){
      const catid = category._id.toString();
      return catid;
    } else {
      return false;
    }
  } catch (error) {
    return error.message;
  }
  return false;  
}

export async function getProductBySlug(slug) {
  if(typeof slug == 'undefined' || slug==''){
    return false;
  }
  try {
    let product = await productModel.findOne({slug: slug}).select('_id');
    if(product || product != null){
      const productid = product._id.toString();
      return productid;
    } else {
      return false;
    }
  } catch (error) {
    return error.message;
  }
  return false;  
}