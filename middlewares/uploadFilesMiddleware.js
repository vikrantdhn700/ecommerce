import path from "path";
import multer from "multer";
import fse from "fs-extra";
import fileModel from "../models/fileModel.js";

const currDate = new Date();
const month = currDate.getMonth();
const year = currDate.getFullYear(); 
let folderPath = `./public/uploads/${year}/${month}`; 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {  
        fse.ensureDir(folderPath)
        .then(() => cb(null, folderPath))
        .catch(err => cb(new Error(err)))  
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const newFilename = file.fieldname + '-' + uniqueSuffix + ext;
      cb(null, newFilename);
    }
  });

export const uploadFiles = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb){
        const match = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
        if (match.indexOf(file.mimetype) === -1){
            cb(new Error('Invalid file type'));        
        } else{            
            cb(null, true);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 2    // 2 mb
    }
}).any();

