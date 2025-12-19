const express = require("express");
const { UserController, ParametersController } = require("./controllers");
const {
  CalculateXR,
  CalculateXS,
  CalculateMR,
  CalculateIMR,
  CalculateCUSUM,
  CalculatePChart,
  CalculateNPChart,
  CalculateUChart,
  CalculateCChart,
} = require("./calculations");

const checkAuth = require("./middleware/checkAuth");

const router = express.Router();

// Router пользователя
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", checkAuth, UserController.currentUser);

// Работа с параметрами
router.get("/all/details/:id", checkAuth, ParametersController.getAllDetails);
router.post("/param/create", checkAuth, ParametersController.createParam);
router.post("/param/update", checkAuth, ParametersController.updateParam);
router.get(
  "/param/write-test/:id",
  checkAuth,
  ParametersController.writeTestData
);

// Расчёты
router.get("/calculate/xrmiddle", checkAuth, CalculateXR.getControlChartData);
router.get("/calculate/xscard", checkAuth, CalculateXS.getControlChartData);
router.get("/calculate/mrcard", checkAuth, CalculateMR.getControlChartData);
router.get("/calculate/imrcard", checkAuth, CalculateIMR.getControlChartData);
router.get("/calculate/cusum", checkAuth, CalculateCUSUM.getControlChartData);
router.get("/calculate/pcard", checkAuth, CalculatePChart.getControlChartData);
router.get(
  "/calculate/npcard",
  checkAuth,
  CalculateNPChart.getControlChartData
);
router.get("/calculate/ucard", checkAuth, CalculateUChart.getControlChartData);
router.get("/calculate/ccard", checkAuth, CalculateCChart.getControlChartData);

module.exports = router;
