import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import mysql from "mysql";
import path from "path";
import { Constants, HashAlgo } from "./common/Constants";
import {
  CompareWith,
  Destination,
  e2eeCompare,
  e2eeTranslate,
  ResponseTranslate,
  Source,
  ResponseCompare,
} from "./common/Api";
import {
  getKeyPair,
  getSessionToken,
  KeyPair,
  prepareKeyPairs,
} from "./appserver";

import session, { Session, Cookie, SessionData } from "express-session";

dotenv.config({ path: "./.env" });

const app = express();

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  port: Number(process.env.DATABASE_PORT),
});

const publicDir = path.join(__dirname, "./public");
const e2eeDir = path.join(__dirname, "../js");

app.use(express.static(publicDir));
app.use(express.static(e2eeDir));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({ secret: "ghiscure", resave: false, saveUninitialized: true })
);

app.set("view engine", "hbs");

type User = {
  id: string;
  email: string;
};

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL connected!");
  }
});

app.get("/", (req, res) => {
  if (req.session.user)
    return res.render("index", { user: req.session.user.id });
  return res.render("index");
});

app.get("/register", async (req, res) => {
  let keypair: KeyPair = { publicKey: "", wrappedPrivateKey: "", id: 0 };

  while (keypair.id == 0) {
    keypair = await getKeyPair();
  }
  res.render("register", {
    publicKey: Buffer.from(keypair.publicKey).toString("base64"),
    publicKeyId: keypair.id,
  });
});

app.get("/public-key", async (req, res) => {
  let keypair: KeyPair = { publicKey: "", wrappedPrivateKey: "", id: 0 };

  while (keypair.id == 0) {
    keypair = await getKeyPair();
  }
  return res.json({
    publicKey: Buffer.from(keypair.publicKey).toString("base64"),
    publicKeyId: keypair.id,
  });
});

app.get("/login", async (req, res) => {
  let keypair: KeyPair = { publicKey: "", wrappedPrivateKey: "", id: 0 };

  while (keypair.id == 0) {
    keypair = await getKeyPair();
  }
  res.render("login", {
    publicKey: Buffer.from(keypair.publicKey).toString("base64"),
    publicKeyId: keypair.id,
  });
});

const translate = async (keyPairId: number, ciphertext: string) => {
  console.log(ciphertext);
  const keyPair = await getKeyPair(keyPairId);
  const sessionToken = await getSessionToken();
  const source: Source = {
    format: "",
    wrappingKeyId: process.env.WRAPPING_KEY_ID as string,
    wrappedPrivateKey: keyPair.wrappedPrivateKey,
    sessionKeyAlgo: "AES-GCM-256",
    macAlgo: "HMAC-SHA256",
    ciphertext: ciphertext,
  };

  const destination: Destination = {
    format: "",
    encryptionKeyId: process.env.TRANSPORT_KEY_ID as string,
    algo: "AES-GCM-256",
  };

  const translateResponse = await e2eeTranslate({
    slotId: parseInt(process.env.SLOT_ID as string),
    sessionToken: sessionToken,
    source,
    destination,
  });
  return translateResponse;
};

const compare = async (
  keypairId: number,
  ciphertext: string,
  translateResponse: ResponseTranslate
) => {
  const keyPair = await getKeyPair(keypairId);
  const sessionToken = await getSessionToken();
  const source: Source = {
    format: "",
    wrappingKeyId: process.env.WRAPPING_KEY_ID as string,
    wrappedPrivateKey: keyPair.wrappedPrivateKey,
    sessionKeyAlgo: "AES-GCM-256",
    macAlgo: "HMAC-SHA256",
    ciphertext: ciphertext,
  };

  const compareWith: CompareWith = {
    format: "",
    encryptionKeyId: process.env.TRANSPORT_KEY_ID as string,
    keyVersion: translateResponse.keyVersion,
    algo: "AES-GCM-256",
    ciphertext: translateResponse.ciphertext,
    iv: translateResponse.iv,
    mac: translateResponse.mac,
  };
  try {
    const compareResponse = await e2eeCompare({
      slotId: parseInt(process.env.SLOT_ID as string),
      sessionToken,
      source,
      compareWith,
    });
    return compareResponse;
  } catch (error) {
    let response: ResponseCompare = { equals: false };
    return response;
  }
};

app.post("/auth/login", (req, res) => {
  const { name, password, publicKey, publicKeyId } = req.body;
  db.query(
    "SELECT password FROM users WHERE name = ?",
    [name],
    async (error, result) => {
      if (result.length == 0)
        return res.render("login", { message: "account not found" });

      try {
        const storedSealedPIN = JSON.parse(result[0].password);
        const compareResponse = await compare(publicKeyId, password, {
          keyVersion: storedSealedPIN.keyVersion,
          ciphertext: storedSealedPIN.ciphertext,
          iv: storedSealedPIN.iv,
          mac: storedSealedPIN.mac,
        });
        console.log(JSON.stringify(compareResponse));

        if (!compareResponse.equals)
          return res.render("login", {
            message: "invalid password",
            publicKey: publicKey,
            publicKeyId: publicKeyId,
          });

        let user: User = { id: name, email: "email" };
        req.session.user = user;

        return res.redirect("/");
      } catch (error) {
        console.log(error);
        return res.render("login", { message: "login failed" });
      }
    }
  );
});

app.post("/auth/register", (req, res) => {
  const { name, email, password, password_confirm, publicKey, publicKeyId } =
    req.body;

  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (error, result) => {
      if (error) {
        console.log(error);
      }

      try {
        if (result.length > 0) {
          return res.render("register", {
            message: "This email is already in use",
            publicKey: publicKey,
            publicKeyId: publicKeyId,
          });
        }

        const storedSealedPIN = await translate(publicKeyId, password);

        console.log(storedSealedPIN);

        const compareResponse = await compare(
          publicKeyId,
          password_confirm,
          storedSealedPIN
        );

        if (!compareResponse.equals)
          return res.render("register", {
            message: "Passsword mismatch",
            publicKey: publicKey,
            publicKeyId: publicKeyId,
          });

        db.query(
          "INSERT INTO users SET?",
          {
            name: name,
            email: email,
            password: JSON.stringify(storedSealedPIN),
          },
          (err, result) => {
            if (error) {
              console.log(error);
            } else {
              return res.render("register", {
                message: "User registered!",
                status: true,
              });
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    }
  );
});

app.get("/delete", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });

  db.query("DELETE FROM users", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      return res.redirect("/");
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
  res.redirect("/");
});

app.listen(3030, () => {
  console.log("server started on port 3030");
  getKeyPair();
});
