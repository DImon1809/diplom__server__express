const { prisma } = require("../prisma/prisma-client");

const CalculateCChart = {
  getControlChartData: async (req, res) => {
    try {
      const userId = Number(req.user);

      const parameters = await prisma.parameter.findMany({
        where: { userId },
        select: {
          name: true,
          details: true,
          upperLimit: true,
          lowerLimit: true,
        },
      });

      if (!parameters.length) {
        return res.status(404).json({ message: "Параметры не найдены" });
      }

      const firstParam = parameters[0];
      const numbers = firstParam.details.map(Number);
      const upperLimit = firstParam.upperLimit
        ? Number(firstParam.upperLimit)
        : Infinity;
      const lowerLimit = firstParam.lowerLimit
        ? Number(firstParam.lowerLimit)
        : -Infinity;

      // Бинаризация дефектов: 1 = дефект, 0 = годное
      const defectiveArray = numbers.map((x) =>
        x < lowerLimit || x > upperLimit ? 1 : 0
      );

      // Разбиваем на подгруппы одинакового размера
      const groupSize = 5;
      const groups = [];
      for (let i = 0; i < defectiveArray.length; i += groupSize) {
        groups.push(defectiveArray.slice(i, i + groupSize));
      }

      // Число дефектов на подгруппу
      const cValues = groups.map((g) => g.reduce((a, b) => a + b, 0));
      const cBar = cValues.reduce((a, b) => a + b, 0) / cValues.length;

      const controlLimits = {
        UCL: cBar + 3 * Math.sqrt(cBar),
        LCL: Math.max(cBar - 3 * Math.sqrt(cBar), 0),
      };

      res.json({ cValues, cBar, controlLimits });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateCChart;
