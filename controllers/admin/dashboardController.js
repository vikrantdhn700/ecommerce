import bcrypt from 'bcrypt';
import Jwt from "jsonwebtoken";
//import { getcurrentAdmin } from "../../helpers/global.js";

export const dashboard= async (request,response) => {
    return response.render("backend/index");
}

