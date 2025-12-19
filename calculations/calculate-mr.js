const { prisma } = require("../prisma/prisma-client");

// Коэффициенты для подгрупп размера n
const DR_Coeffs = {
  2: { D3: 0, D4: 3.267, A_median: 1.88 },
  3: { D3: 0, D4: 2.574, A_median: 1.023 },
  4: { D3: 0, D4: 2.282, A_median: 0.729 },
  5: { D3: 0, D4: 2.114, A_median: 0.577 },
  6: { D3: 0.076, D4: 2.004, A_median: 0.483 },
  7: { D3: 0.136, D4: 1.924, A_median: 0.419 },
  8: { D3: 0.184, D4: 1.864, A_median: 0.373 },
  9: { D3: 0.223, D4: 1.816, A_median: 0.337 },
  10: { D3: 0.256, D4: 1.777, A_median: 0.308 },
};

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

const CalculateMR = {
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
      const { D3, D4, A_median } = DR_Coeffs[groupSize];

      const groups = [];
      for (let i = 0; i < numbers.length; i += groupSize) {
        groups.push(numbers.slice(i, i + groupSize));
      }

      const subgroups = groups.map((group) => {
        const med = median(group);
        const range = Math.max(...group) - Math.min(...group);
        return { median: med, r: range };
      });

      const medianAvg =
        subgroups.reduce((acc, d) => acc + d.median, 0) / subgroups.length;
      const rAvg =
        subgroups.reduce((acc, d) => acc + d.r, 0) / subgroups.length;

      const Mlimits = {
        UCL: medianAvg + A_median * rAvg,
        LCL: medianAvg - A_median * rAvg,
      };

      const Rlimits = {
        UCL: D4 * rAvg,
        LCL: D3 * rAvg,
      };

      res.json({
        chartData: subgroups,
        Mlimits,
        Rlimits,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateMR;
