const express = require("express");
const multer = require("multer");
const {
  UserController,
  PostController,
  CommentController,
  LikeController,
  FollowController,
  ParametersController,
  CalculateCards,
} = require("./controllers");

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
router.get(
  "/calculate/xrmiddle",
  checkAuth,
  CalculateCards.getControlChartData
);

module.exports = router;
