const { prisma } = require("../prisma/prisma-client");

const XS_Coeffs = {
  2: { A3: 2.659, B3: 0, B4: 3.267 },
  3: { A3: 1.954, B3: 0, B4: 2.568 },
  4: { A3: 1.628, B3: 0, B4: 2.266 },
  5: { A3: 1.427, B3: 0, B4: 2.114 },
  6: { A3: 1.287, B3: 0, B4: 2.004 },
  7: { A3: 1.182, B3: 0.076, B4: 1.924 },
  8: { A3: 1.099, B3: 0.136, B4: 1.864 },
  9: { A3: 1.032, B3: 0.184, B4: 1.816 },
  10: { A3: 0.975, B3: 0.223, B4: 1.777 },
};

const CalculateXS = {
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

      if (numbers.length < 100) {
        return res
          .status(400)
          .json({ message: "Значений должно быть не меньше 100" });
      }

      const groupSize = 5;
      const { A3, B3, B4 } = XS_Coeffs[groupSize];

      const groups = [];
      for (let i = 0; i < numbers.length; i += groupSize) {
        groups.push(numbers.slice(i, i + groupSize));
      }

      const subgroups = groups.map((group) => {
        const avg = group.reduce((a, b) => a + b, 0) / group.length;

        const mean = avg;
        const variance =
          group.reduce((acc, val) => acc + (val - mean) ** 2, 0) /
          (group.length - 1);
        const stdDev = Math.sqrt(variance);

        return { xbar: avg, s: stdDev };
      });

      const xbarAvg =
        subgroups.reduce((acc, d) => acc + d.xbar, 0) / subgroups.length;
      const sAvg =
        subgroups.reduce((acc, d) => acc + d.s, 0) / subgroups.length;

      const XbarLimits = {
        UCL: xbarAvg + A3 * sAvg,
        LCL: xbarAvg - A3 * sAvg,
      };

      const Slimits = {
        UCL: B4 * sAvg,
        LCL: B3 * sAvg,
      };

      res.json({
        chartData: subgroups,
        XbarLimits,
        Slimits,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateXS;
