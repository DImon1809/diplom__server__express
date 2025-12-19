const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

require("dotenv").config();

const UserController = {
  register: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "Все поля обязательные!" });

      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser)
        return res
          .status(400)
          .json({ message: "Пользователь уже существует!" });

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashPassword,
        },
      });

      return res.status(200).json(user);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "Все поля обязательные!" });

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user)
        return res.status(400).json({ message: "Пользователь не найден!" });

      const isValidPass = await bcrypt.compare(password, user.password);

      if (!isValidPass)
        return res.status(400).json({ message: "Неверный пароль!" });

      const token = jwt.sign({ userId: user.id }, process.env.SECRETKEY);

      return res.status(200).json({ jwtToken: token });
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  currentUser: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user,
        },
        include: {
          parameters: true,
        },
      });

      if (!user)
        return res
          .status(400)
          .json({ message: "Не удалось найти пользователя!" });

      return res.status(200).json(user);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },
};

module.exports = UserController;
