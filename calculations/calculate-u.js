const { prisma } = require("../prisma/prisma-client");
const OpenAI = require("openai");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.proxyapi.ru/openai/v1",
});

const CalculateUChart = {
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

      const defectiveArray = numbers.map((x) =>
        x < lowerLimit || x > upperLimit ? 1 : 0
      );

      const groupSize = 5;
      const groups = [];
      for (let i = 0; i < defectiveArray.length; i += groupSize) {
        groups.push(defectiveArray.slice(i, i + groupSize));
      }

      const nArray = groups.map((g) => g.length);
      const uValues = groups.map(
        (g, i) => g.reduce((a, b) => a + b, 0) / g.length
      );

      const totalDefects = groups.reduce(
        (acc, g) => acc + g.reduce((a, b) => a + b, 0),
        0
      );
      const totalUnits = nArray.reduce((acc, n) => acc + n, 0);
      const uBar = totalDefects / totalUnits;

      const controlLimits = nArray.map((n) => {
        const sigma = Math.sqrt(uBar / n);
        return {
          UCL: uBar + 3 * sigma,
          LCL: Math.max(uBar - 3 * sigma, 0),
        };
      });

      const messaageAI = await openai.responses.create({
        model: "gpt-4.1-nano",
        input: `Я высчитал значения u-контрольной карты. 
        У меня получились следующие данные ${JSON.stringify({
          uValues,
          uBar,
          controlLimits,
        })}.
        Что ты можешь кратко сказать о качестве протикания технологического процесса.
        Какие на твой взгляд есть потенциальные проблемы. Напиши кратко`,
      });

      res.json({
        uValues,
        uBar,
        controlLimits,
        comment: messaageAI?.output_text || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateUChart;
