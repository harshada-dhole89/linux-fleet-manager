function adminMiddleware(req, res, next) {
if (req.user.role !== "admin") {
    return res.status(403).send("Admin access required");
}
next();
}
module.exports = adminMiddleware;function adminMiddleware(req, res, next) {
    console.log("User from token:", req.user);

    if (req.user.role !== "admin") {
        return res.status(403).send("Admin access required");
    }

    next();
}

module.exports = adminMiddleware;