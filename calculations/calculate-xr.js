const { prisma } = require("../prisma/prisma-client");
const OpenAI = require("openai");

require("dotenv").config();

const D3D4 = {
  2: { D3: 0, D4: 3.267 },
  3: { D3: 0, D4: 2.574 },
  4: { D3: 0, D4: 2.282 },
  5: { D3: 0, D4: 2.114 },
  6: { D3: 0.076, D4: 2.004 },
  7: { D3: 0.136, D4: 1.924 },
  8: { D3: 0.184, D4: 1.864 },
  9: { D3: 0.223, D4: 1.816 },
  10: { D3: 0.256, D4: 1.777 },
};

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.proxyapi.ru/openai/v1",
});

const CalculateXR = {
  getControlChartData: async (req, res) => {
    try {
      const userId = Number(req.user);
      const { id: parameterId } = req.query;

      const parameters = await prisma.parameter.findMany({
        where: { userId },
        select: { id: true, name: true, details: true },
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
      const { D3, D4 } = D3D4[groupSize];
      const A2 = 0.577;

      const groups = [];
      for (let i = 0; i < numbers.length; i += groupSize) {
        groups.push(numbers.slice(i, i + groupSize));
      }

      const subgroups = groups.map((group) => {
        const avg = group.reduce((a, b) => a + b, 0) / group.length;
        const range = Math.max(...group) - Math.min(...group);
        return { xbar: avg, r: range };
      });

      const xbarAvg =
        subgroups.reduce((acc, d) => acc + d.xbar, 0) / subgroups.length;
      const rAvg =
        subgroups.reduce((acc, d) => acc + d.r, 0) / subgroups.length;

      const XbarLimits = {
        UCL: xbarAvg + A2 * rAvg,
        LCL: xbarAvg - A2 * rAvg,
      };

      const Rlimits = {
        UCL: D4 * rAvg,
        LCL: D3 * rAvg,
      };

      const messaageAI = await openai.responses.create({
        model: "gpt-4.1-nano",
        input: `Я высчитал значения контрольной карты средних значений и размахов. 
        У меня получились следующие данные ${JSON.stringify({
          chartData: subgroups,
          XbarLimits,
          Rlimits,
        })}.
        Что ты можешь кратко сказать о качестве протикания технологического процесса.
        Какие на твой взгляд есть потенциальные проблемы. Напиши кратко`,
      });

      await prisma.xRMiddle.upsert({
        where: {
          parameterId: Number(parameterId),
        },
        update: {
          chartData: subgroups,
          XbarLimits,
          Rlimits,
          comment: messaageAI?.output_text || "",
        },
        create: {
          chartData: subgroups,
          XbarLimits,
          Rlimits,
          comment: messaageAI?.output_text || "",
          parameterId: Number(parameterId),
        },
      });

      res.json({
        chartData: subgroups,
        XbarLimits,
        Rlimits,
        comment: messaageAI?.output_text || "",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка сервера!", error: err.message });
    }
  },
};

module.exports = CalculateXR;
