const { prisma } = require("../prisma/prisma-client");
const OpenAI = require("openai");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.proxyapi.ru/openai/v1",
});

const CalculateNPChart = {
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

      // Бинаризация: 1 = дефект, 0 = годное
      const defectiveArray = numbers.map((x) =>
        x < lowerLimit || x > upperLimit ? 1 : 0
      );

      // Разбиваем на подгруппы (размер n должен быть одинаковый!)
      const groupSize = 5; // размер подгруппы
      const groups = [];
      for (let i = 0; i < defectiveArray.length; i += groupSize) {
        groups.push(defectiveArray.slice(i, i + groupSize));
      }

      const npValues = groups.map((group) => group.reduce((a, b) => a + b, 0));
      const n = groups[0].length;
      const npBar = npValues.reduce((a, b) => a + b, 0) / npValues.length;

      const sigma = Math.sqrt(npBar * (1 - npBar / n));
      const controlLimits = {
        UCL: npBar + 3 * sigma,
        LCL: Math.max(npBar - 3 * sigma, 0),
      };

      const messaageAI = await openai.responses.create({
        model: "gpt-4.1-nano",
        input: `Я высчитал значения np-контрольной карты. 
        У меня получились следующие данные ${JSON.stringify({
          npValues,
          npBar,
          controlLimits,
        })}.
        Что ты можешь кратко сказать о качестве протикания технологического процесса.
        Какие на твой взгляд есть потенциальные проблемы. Напиши кратко`,
      });

      res.json({
        npValues,
        npBar,
        controlLimits,
        comment: messaageAI?.output_text || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateNPChart;
