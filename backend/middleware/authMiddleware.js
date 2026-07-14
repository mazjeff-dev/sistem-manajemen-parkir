const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    console.log("=== REQUEST BARU ===");

    console.log("Headers:", req.headers);

    const authHeader = req.headers.authorization;

    console.log("Authorization:", authHeader);

    if (!authHeader) {
        return res.status(401).json({
            message: "Token tidak tersedia"
        });
    }

    const token = authHeader.split(" ")[1];

    console.log("Token:", token);

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("Decoded:", decoded);

        req.user = decoded;

        next();

    } catch (err) {

        console.log("JWT ERROR:", err.message);

        return res.status(401).json({
            message: "Token expired atau tidak valid"
        });

    }

};

module.exports = verifyToken;