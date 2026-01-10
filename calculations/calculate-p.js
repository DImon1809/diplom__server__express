const { prisma } = require("../prisma/prisma-client");
const OpenAI = require("openai");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.proxyapi.ru/openai/v1",
});

const CalculatePChart = {
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
      const upperLimit = firstParam?.upperLimit
        ? Number(firstParam.upperLimit)
        : Infinity;
      const lowerLimit = firstParam?.lowerLimit
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

      const pValues = groups.map((group) => {
        const defective = group.filter((x) => x === 1).length;
        return defective / group.length;
      });

      const pBar = pValues.reduce((a, b) => a + b, 0) / pValues.length;

      const controlLimits = pValues.map((groupP, i) => {
        const n = groups[i].length;
        const sigma = Math.sqrt((pBar * (1 - pBar)) / n);
        return {
          UCL: Math.min(pBar + 3 * sigma, 1),
          LCL: Math.max(pBar - 3 * sigma, 0),
        };
      });

      const messaageAI = await openai.responses.create({
        model: "gpt-4.1-nano",
        input: `Я высчитал значения p-контрольной карты. 
        У меня получились следующие данные ${JSON.stringify({
          pValues,
          pBar,
          controlLimits,
        })}.
        Что ты можешь кратко сказать о качестве протикания технологического процесса.
        Какие на твой взгляд есть потенциальные проблемы. Напиши кратко`,
      });

      res.json({
        pValues,
        pBar,
        controlLimits,
        comment: messaageAI?.output_text || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculatePChart;
