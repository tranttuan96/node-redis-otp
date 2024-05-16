import UserModel from "../model/User.model.js";
import { client } from "../server.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";

/** POST: http://localhost:{{PORT}}/api/user/verify 
 * @param : {
  "username" : "example123",
  "email" : "example@gmail.com",
  "otp" : "1234",
}
*/
export async function verifyUser(req, res, next) {
  
}

/** POST: http://localhost:{{PORT}}/api/user/register 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william"
}
*/
export async function register(req, res) {
  console.log("🚀 ~ register ~ req:", req.body)
  try {
    const { username, password, email, firstName, lastName } = req.body;

    // Generate a random OTP using the otp-generator package
    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // check the existing user
    const existUsername = new Promise((resolve, reject) => {
      UserModel.findOne({ username: username }, function (err, user) {
        if (err) reject(new Error(err));
        if (user) reject({ error: "Please use unique username" });

        resolve();
      });
    });

    // check for existing email
    const existEmail = new Promise((resolve, reject) => {
      UserModel.findOne({ email: email }, function (err, email) {
        if (err) reject(new Error(err));
        if (email) reject({ error: "Please use unique Email" });

        resolve();
      });
    });

    await Promise.all([existUsername, existEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const user = new UserModel({
                username,
                password: hashedPassword,
                email,
                firstName,
                lastName,
              });

              // Store the OTP in Redis, with the user's email as the key
              client.set(email, otp);

              const { password, ...responseUser } = user._doc;
              // return save result as a response
              user
                .save()
                .then((result) =>
                  res.status(201).send({
                    msg: "User Register Successfully",
                    OTP: otp,
                    User: responseUser,
                  })
                )
                .catch((error) => res.status(500).send({ error }));
            })
            .catch((error) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        }
      })
      .catch((error) => {
        return res.status(500).send({ error });
      });
  } catch (error) {
    return res.status(500).send(error);
  }
}

/** POST: http://localhost:{{PORT}}/api/user/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/
export async function login(req, res) {}
