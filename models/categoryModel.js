import mongoose from "mongoose";
import mongooseSlugGenerator from "mongoose-slug-generator";
import fileModel from "./fileModel.js";

let options = {
    separator: "-",
    lang: "en",
};
mongoose.plugin(mongooseSlugGenerator, options);


const categorySchema = mongoose.Schema({
    name: {type:String, required:true, trim:true},
    description: {type:String, trim:true},
    slug: {type:String, slug: ["name"], trim:true, unique: true},
    image: {type:  mongoose.Schema.Types.ObjectId, ref: 'files', trim:true}
},{ timestamps: true });

// Delete Image 
categorySchema.pre('deleteOne', async function(next) {
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

const categoryModel= mongoose.model('categories',categorySchema);
export default categoryModel;