import mongoose from "mongoose";
import fse from "fs-extra";
import mongooseSlugGenerator from "mongoose-slug-generator";
import fileModel from "./fileModel.js";

let options = {
    separator: "-",
    lang: "en",
};
mongoose.plugin(mongooseSlugGenerator, options);

const productSchema = mongoose.Schema({
    //_id: mongoose.Schema.Types.ObjectId,
    admin_id: {type:  mongoose.Schema.Types.ObjectId, ref: 'admins', required:true},
    title: {type:String, required:true, trim:true},
    slug: {type:String, slug: ["title"], trim:true, unique: true},
    description: {type:String, required:true, trim:true},
    price: {type: mongoose.Decimal128 , required:true, trim:true},
    category: {type:  mongoose.Schema.Types.ObjectId, ref: 'categories', trim:true},
    image: {type:  mongoose.Schema.Types.ObjectId, ref: 'files', trim:true},
},{ timestamps: true });

// Delete Image 
productSchema.pre('deleteOne', async function(next) {
    const delId = this.getQuery()._id;
    const getimage= await this.model.findById(delId).select('image').exec();
    if(getimage){
        let image_id = getimage.image;
        const getImageDetail = await fileModel.findById(image_id).select('filename destination').exec();
        if(getImageDetail){
            let deletePath = getImageDetail.destination+'/'+getImageDetail.filename;
            fse.removeSync(deletePath, err => {
                if (err) return console.error(err)
            });
            const rtrn = await fileModel.deleteOne({ _id: image_id })
            if(rtrn){
                next();
            } else {
                console.log("Not deleted");
            }          
        }        
    }
  })

const productModel= mongoose.model('products',productSchema);
export default productModel;



