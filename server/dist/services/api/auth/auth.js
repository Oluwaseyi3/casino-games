"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.authenticateAdminAPIKey = exports.authenticateAPIKey = exports.authenticatetoken = void 0;
const constants_1 = require("../../../config/constants");
const User_1 = require("../../../models/User");
const authenticatetoken = function (req, res, next) {
    try {
        if (!req.headers.authorization) {
            res
                .status(401)
                .json({ success: false, message: "No authorization header" });
            return;
        }
        const authHeader = req.headers.authorization;
        const parts = authHeader.split(":");
        if (parts.length !== 2) {
            res
                .status(401)
                .json({ success: false, message: "Invalid authorization format" });
            return;
        }
        const [serverKey, token] = parts;
        if (serverKey !== constants_1.SERVER_API_KEY) {
            res.status(401).json({ success: false, message: "Invalid API key" });
            return;
        }
        if (!token) {
            res.status(401).json({ success: false, message: "No token provided" });
            return;
        }
        User_1.UserModel.findByToken(token, (err, user) => {
            if (err) {
                res.status(500).json({ success: false, message: "Database error" });
                return;
            }
            if (!user) {
                res.status(401).json({ success: false, message: "Invalid token" });
                return;
            }
            else {
                req.token = token;
                req.user = user;
                next();
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Authentication error" });
        return;
    }
};
exports.authenticatetoken = authenticatetoken;
const authenticateAPIKey = function (req, res, next) {
    if (!req.headers.authorization) {
        throw Error("Wrong Authorization Token");
    }
    const serverKey = req.headers.authorization;
    if (serverKey !== constants_1.SERVER_API_KEY) {
        res.status(403).send({ auth: false, message: "Wrong cookie!" });
        return;
    }
    next();
};
exports.authenticateAPIKey = authenticateAPIKey;
const authenticateAdminAPIKey = function (req, res, next) {
    if (!req.headers.authorization) {
        throw Error("Wrong Authorization Token");
    }
    const serverKey = req.headers.authorization;
    if (serverKey !== constants_1.SERVER_API_KEY) {
        res.status(403).send({ auth: false, message: "Wrong cookie!" });
        return;
    }
    next();
};
exports.authenticateAdminAPIKey = authenticateAdminAPIKey;
/**
 * Middleware to validate a request against a given Joi schema.
 * @param schema - The Joi schema to validate against.
 * @param source - The part of the request to validate (e.g., 'body', 'query', 'params').
 */
const validateRequest = (schema, source = "body") => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        allowUnknown: true,
    });
    if (error) {
        // Respond with validation errors
        res.status(400).json({
            status: "error",
            message: "Validation failed",
            errors: error.details.map((err) => ({
                path: err.path.join("."),
                message: err.message,
            })),
        });
    }
    // Replace the validated value in the request (optional)
    req[source] = value;
    // Proceed to the next middleware
    next();
};
exports.validateRequest = validateRequest;
