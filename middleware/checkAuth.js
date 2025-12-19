const jwt = require("jsonwebtoken");

require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) return res.status(401).json({ message: "Ошибка авторизации!" });

    const verify = jwt.verify(token, process.env.SECRETKEY).userId;

    if (!verify)
      return res.status(403).json({ message: "Ошибка авторизации!" });

    req.user = verify;

    next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: "Ошибка сервера!" });
  }
};

module.exports = authenticateToken;
