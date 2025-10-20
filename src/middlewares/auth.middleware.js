import jwt from "jsonwebtoken";
import pkg from "helper-utils-library";
const { failureResponse, Unauthorized } = pkg;

function auth(req, res, next) {
    try {
        let token = req.headers["authorization"];
        if (!token) {
            return failureResponse(res, new Unauthorized("Authorization token is required"));
        }
        if (token.startsWith("Bearer ")) {
            token = token.replace("Bearer ", "");
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        next(error);
    }
}

export default auth;
