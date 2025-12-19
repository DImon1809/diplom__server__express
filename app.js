const express = require("express");
const router = require("./router");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.listen(process.env.PORT, (err) =>
  err
    ? console.error(err)
    : console.log(`Server working on ${process.env.PORT}...`)
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", router);
