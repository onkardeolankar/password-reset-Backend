var express = require("express");
var router = express.Router();
const { mongodb, mongoClient } = require("../dbconfig");
const { authenticate } = require("../bin/auth");
var nodemailer = require("nodemailer");
var randomstring = require("randomstring");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const URL = process.env.DB_URL;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("Server Running Sucessfully");
});

router.post("/register", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("passwordReset");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(request.body.password, salt);
    request.body.password = hash;
    await db.collection("users").insertOne(request.body);
    await connection.close();
    response.json({
      message: "User Registered!",
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("passwordReset");
    const user = await db
      .collection("users")
      .findOne({ username: request.body.username });

    if (user) {
      const match = await bcrypt.compare(request.body.password, user.password);
      if (match) {
        //Token
        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.SECRET
        );
        // console.log(token);
        response.json({
          message: "Successfully Logged In!!",
          token,
        });
      } else {
        response.json({
          message: "Password is incorrect!!",
        });
      }
    } else {
      response.json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/resetpassword", async function (request, response) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("passwordReset");
    const user = await db
      .collection("users")
      .findOne({ email: request.body.email });
    if (user) {
      let mailid = request.body.email;
      let rString = randomstring.generate(7);
      let link =
        "https://password-reset-taskk.netlify.app/reset-password-page";
      await db
        .collection("users")
        .updateOne({ email: mailid }, { $set: { rString: rString } });
      await connection.close();

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "testnodemail3@gmail.com",
          pass: process.env.PASS,
        },
      });

      var mailOptions = {
        from: "testnodemail3@gmail.com",
        to: mailid,
        subject: "Password Reset",
        text: `Your Random text is ${rString}. Click the link to reset password ${link}`,
        html: `<h2> Your Random text is ${rString}. Click the link to reset password <a href=${link}>Click here</a></h2>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          response.json({
            message: "Email not send",
          });
        } else {
          console.log("Email sent: " + info.response);
          response.json({
            message: "Email Send",
          });
        }
      });
      response.json({
        message: "Email Send",
      });
    } else {
      response.json({
        message: "Email Id not match / User not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/reset-password-page", async function (request, response) {
  let mailid = request.body.email;
  let String = request.body.rString;
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("passwordReset");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(request.body.password, salt);
    request.body.password = hash;
    const user = await db
      .collection("users")
      .findOne({ email: request.body.email });
    if (user) {
      if (user.rString === request.body.rString) {
        await db
          .collection("users")
          .updateOne(
            { rString: String },
            { $set: { password: request.body.password } }
          );
        response.json({
          message: "Password reset done",
        });
      } else {
        response.json({
          message: "Random String is incorrect",
        });
      }
    } else {
      response.json({
        message: "Email Id not match / User not found",
      });
    }
    await db
      .collection("users")
      .updateOne({ rString: String }, { $unset: { rString: "" } });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
