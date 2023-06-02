import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import path from 'path';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import connection from "./config/db.js";
import router from "./routes/web.js";
import * as cartController from "./controllers/cartController.js";
import * as globalHelper from "./helpers/global.js";

dotenv.config();
const app = express();
const port = process.env.PORT;

const dbname = process.env.DB_NAME;
const dbuser = process.env.DB_USERNAME;
const dbpass = process.env.DB_PASSWORD;
const URL= `mongodb+srv://${dbuser}:${dbpass}@userauth.inxxrzw.mongodb.net/${dbname}?retryWrites=true&w=majority`;
connection(dbuser, dbpass, URL);
const mongodbStoress = MongoDBStore(session);
var store = new mongodbStoress({
  uri: URL,
  collection: 'mysessions'
});

app.use(express.json());
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors());
app.use(session({
  secret: process.env.JWT_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24},
  store: store
}));

app.use( async (request, response, next) => {
  if(request.session.isAdminAuthenticated){    
    const getAdmin = request.session.admin;
    response.locals.admin = getAdmin; 
    response.locals.isAdminAuthenticated = true;
  } else {
    response.locals.isAdminAuthenticated = false;
  }
  if(request.session.isUserAuthenticated){    
    const getUser = request.session.user;
    response.locals.user = getUser; 
    response.locals.isUserAuthenticated = true;    
  } else {
    response.locals.isUserAuthenticated = false;
  }

  if(request.session.isUserAuthenticated){ 
    if(request.session.cart){
      response.locals.cart =  request.session.cart;
      await cartController.saveCartToUser(request,response); 
    } else {      
      const userCart= await cartController.getUserCart(request,response); 
      if(userCart){
        response.locals.cart = JSON.parse(userCart);
      } else {
        response.locals.cart = false;
      }      
    }    
  } else {
    if(request.session.cart){
      response.locals.cart =  request.session.cart;
    }  else {
      response.locals.cart = false;
    }
  }

  response.locals.queryString = request.query; 
  response.locals.originalUrl = request.originalUrl;
  return next();
});

app.locals.getsetting =  {
  "phone": await globalHelper.getSetting('_phone'),
  "email": await globalHelper.getSetting('_email'),
  "sitelogo":await globalHelper.getSetting('_sitelogo'),
  "signupcontent": await globalHelper.getSetting('_signupcontent'),
  "copyright": await globalHelper.getSetting('_copyright'),
  "stripe_pk" : process.env.STRIPE_PUBLISH_KEY,
};

app.set('view engine', 'ejs');
app.use(express.static(path.resolve('./public')));
app.use(router);

app.all('*', (req, res) => {
  res.status(404).send('<h1>404! Page not found</h1>');
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}`),
);


