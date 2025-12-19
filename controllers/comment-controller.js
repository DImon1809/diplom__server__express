const { prisma } = require("../prisma/prisma-client");

const CommentController = {
  createComment: async (req, res) => {
    try {
      const { postId, content } = req.body;
      const userId = req.user;

      if (!postId || !content)
        return res.status(400).json({ message: "Все поля обязательные!" });

      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      return res.status(200).json(comment);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user;

      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment)
        return res.status(404).json({ message: "Комментарий не найден!" });

      if (comment.userId !== userId)
        return res.status(403).json({ message: "Нет доступа!" });

      const deleteComment = await prisma.comment.delete({ where: { id } });

      return res.status(200).json(deleteComment);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },
};

module.exports = CommentController;
