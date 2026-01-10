const { prisma } = require("../prisma/prisma-client");
const OpenAI = require("openai");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.proxyapi.ru/openai/v1",
});

const CalculateCUSUM = {
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
          .json({ message: "Должно быть минимум 2 значения для CUSUM" });
      }

      const n = numbers.length;
      const avg = numbers.reduce((a, b) => a + b, 0) / n;
      const sigma = Math.sqrt(
        numbers.reduce((acc, x) => acc + (x - avg) ** 2, 0) / (n - 1)
      );

      const K = 0.5 * sigma;
      const H = 5 * sigma;

      const Cplus = [];
      const Cminus = [];

      numbers.forEach((x, i) => {
        if (i === 0) {
          Cplus.push(Math.max(0, x - (avg + K)));
          Cminus.push(Math.min(0, x - (avg - K)));
        } else {
          Cplus.push(Math.max(0, x - (avg + K) + Cplus[i - 1]));
          Cminus.push(Math.min(0, x - (avg - K) + Cminus[i - 1]));
        }
      });

      const messaageAI = await openai.responses.create({
        model: "gpt-4.1-nano",
        input: `Я высчитал значения кумулятивной контрольной карты. 
        У меня получились следующие данные ${JSON.stringify({
          numbers,
          Cplus,
          Cminus,
          H,
        })}.
        Что ты можешь кратко сказать о качестве протикания технологического процесса.
        Какие на твой взгляд есть потенциальные проблемы. Напиши кратко`,
      });

      res.json({
        numbers,
        Cplus,
        Cminus,
        H,
        comment: messaageAI?.output_text || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateCUSUM;
