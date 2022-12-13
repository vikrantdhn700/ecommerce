import fileModel from "../models/fileModel.js";
export const uploadFilesFunc= async (request,response, cb) => {
     const files = request.files;
     if(files && files.length > 0){
        try {
            let newFileData = [];
            Object.entries(files).forEach(([key, value]) => {                
                newFileData.push({
                    "filename" : files[key].filename,
                    "originalname": files[key].originalname,
                    "destination": files[key].destination,
                    "path": files[key].path,
                    "size": files[key].size,
                    "type": files[key].mimetype
                });
            });
            const insertedData = await fileModel.insertMany(newFileData);
            if(insertedData){
                let returnJson = [];
                Object.entries(insertedData).forEach(([key, value]) => {                
                    returnJson.push({
                        "id" : insertedData[key]._id.toString(),
                        "path": insertedData[key].path,
                        "originalname": insertedData[key].originalname
                    });
                });
                cb("success", returnJson); 
            } else {
                cb("failed",new Error("something error"));
            }
        } catch (error) {
            cb("failed",new Error(error.message));
        }        
     }
}