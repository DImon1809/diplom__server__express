const { prisma } = require("../prisma/prisma-client");

const FollowController = {
  followUser: async (req, res) => {
    try {
      const { followingId } = req.body;
      const userId = req.user;

      if (followingId === userId)
        return res
          .status(400)
          .json({ message: "Вы не можете подписаться на самого себя!" });

      const existingSubscription = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (existingSubscription)
        return res.status(400).json({ messgae: "Подписка уже существует!" });

      const following = await prisma.follows.create({
        data: {
          follower: {
            connect: { id: userId },
          },

          following: {
            connect: { id: followingId },
          },
        },
      });

      return res.status(201).json(following);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  unFollowUser: async (req, res) => {
    try {
      const { followingId } = req.body;
      const userId = req.user;

      const follows = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (!follows)
        return res.status(404).json({ message: "Подписка не существует!" });

      const followDelete = await prisma.follows.delete({
        where: { id: follows.id },
      });

      return res.status(200).json(followDelete);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },
};

module.exports = FollowController;
