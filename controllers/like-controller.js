const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  likePost: async (req, res) => {
    try {
      const { postId } = req.body;
      const userId = req.user;

      if (!postId)
        return res.status(400).json({ message: "Все поля обязательные!" });

      const existingLike = await prisma.like.findFirst({
        where: {
          postId,
          userId,
        },
      });

      if (existingLike)
        return res.status(400).json({ message: "Лайк уже поставлен!" });

      const like = await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      return res.status(200).json(like);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  unLikePost: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user;

      if (!id)
        return res.status(400).json({ message: "Вы уже поставили дизлайк!" });

      const existingLike = await prisma.like.findFirst({
        where: {
          id,
        },
      });

      if (!existingLike || existingLike.userId !== userId)
        return res.status(400).json({ message: "Лайка не существует!" });

      const like = await prisma.like.deleteMany({
        where: {
          id,
        },
      });

      return res.status(200).json(like);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },
};

module.exports = LikeController;
