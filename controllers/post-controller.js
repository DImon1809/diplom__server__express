const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    try {
      const { content } = req.body;

      const authorId = req.user;

      if (!content)
        return res.status(400).json({ message: "Все поля обязательные!" });

      const post = await prisma.post.create({
        data: { content, authorId },
      });

      return res.status(200).json(post);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const userId = req.user;

      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          author: true,
          comments: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      return res.status(200).json(postWithLikeInfo);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user;

      const post = await prisma.post.findUnique({
        where: {
          id,
        },

        include: {
          comments: {
            include: {
              user: true,
            },
          },

          likes: true,
          author: true,
        },
      });

      if (!post) return res.status(404).json({ message: "Пост не найден!" });

      const postWithLikeInfo = {
        ...post,
        likeByUser: post.likes.some((like) => like.userId === userId),
      };

      return res.status(200).json(postWithLikeInfo);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user;

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) return res.status(404).json({ message: "Пост не найден!" });

      if (post.authorId !== userId)
        return res.status(403).json({ message: "Нет доступа!" });

      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
      ]);

      return res.status(200).json(transaction);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },
};

module.exports = PostController;
