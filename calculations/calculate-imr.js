const { prisma } = require("../prisma/prisma-client");

const d2 = 1.128;
const D3 = 0;
const D4 = 3.267;

const CalculateIMR = {
  getControlChartData: async (req, res) => {
    try {
      const userId = Number(req.user);

      const parameters = await prisma.parameter.findMany({
        where: { userId },
        select: { name: true, details: true },
      });

      if (!parameters.length) {
        return res.status(404).json({ message: "Параметры не найдены" });
      }

      const firstParam = parameters[0];
      const numbers = firstParam.details.map(Number);

      if (numbers.length < 2) {
        return res
          .status(400)
          .json({ message: "Должно быть минимум 2 значения для I–MR карты" });
      }

      const MR = [];
      for (let i = 1; i < numbers.length; i++) {
        MR.push(Math.abs(numbers[i] - numbers[i - 1]));
      }

      const avgI = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const avgMR = MR.reduce((a, b) => a + b, 0) / MR.length;

      const ILimits = {
        UCL: avgI + 3 * (avgMR / d2),
        LCL: avgI - 3 * (avgMR / d2),
      };

      const MRlimits = {
        UCL: D4 * avgMR,
        LCL: D3 * avgMR,
      };

      const chartData = numbers.map((value, index) => ({
        value,
        MR: index === 0 ? null : MR[index - 1],
      }));

      res.json({
        chartData,
        ILimits,
        MRlimits,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateIMR;
