const { prisma } = require("../prisma/prisma-client");

const testDetails = require("../mock/data");

const ParametersController = {
  getAllDetails: async (req, res) => {
    try {
      const paramId = Number(req.params.id);

      const parameter = await prisma.parameter.findUnique({
        where: { id: paramId },
        select: { details: true },
      });

      if (!parameter) {
        return res.status(404).json({ message: "Параметр не найден" });
      }

      return res.status(200).json(parameter.details);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  createParam: async (req, res) => {
    try {
      const { name, unit } = req.body;

      const newParameter = await prisma.parameter.create({
        data: {
          name,
          unit,
          details: [],
          user: {
            connect: { id: Number(req.user) },
          },
        },
      });

      return res.status(201).json(newParameter);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  updateParam: async (req, res) => {
    try {
      const { id, details, upperLimit, lowerLimit } = req.body;

      const updatedParameter = await prisma.parameter.update({
        where: { id },
        data: {
          lowerLimit: lowerLimit || String(Math.min(...details.map(Number))),
          upperLimit: upperLimit || String(Math.max(...details.map(Number))),
          details,
        },
      });

      return res.status(201).json(updatedParameter);
    } catch (err) {
      console.error(err);

      return res.status(500).json({ message: "Ошибка сервера!" });
    }
  },

  writeTestData: async (req, res) => {
    try {
      const id = Number(req.params.id);

      const updatedParameter = await prisma.parameter.update({
        where: { id },
        data: {
          details: testDetails.map(String),
        },
      });

      return res.status(201).json(updatedParameter);
    } catch (err) {
      console.error();
    }
  },
};

module.exports = ParametersController;
