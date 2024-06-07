import express, { Request, Response } from "express";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import morgan from "morgan";
import cors from "cors";
import { createHmac } from "node:crypto";
const app = express();
const ACCESTOKEN =
  "TEST-4371925954814872-053012-899f92ec6ed3e6032db563e9999ab1ad-1817169449";
const SECRETKEYVALIDATION =
  "ffb9cdf7cc03f86aa441ca51473187527f17c6679ccabd1bb1c381789d46d92a";
const client = new MercadoPagoConfig({
  accessToken: ACCESTOKEN,
});

const preference = new Preference(client);
const payment = new Payment(client);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.post("/create-preference", async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];
    const requestOptions = {
      idempotencyKey: idempotencyKey as string,
    };
    const result = await preference.create({
      body: {
        items: [
          {
            id: "1234",
            title: "My product",
            quantity: 1,
            unit_price: 2000,
          },
        ],
        back_urls: {
          success: "http://localhost:5173/",
        },
        auto_return: "approved",
        notification_url: "https://664f-161-132-41-81.ngrok-free.app/webhook",
      },
      requestOptions,
    });

    res.json({ id: result.id });
  } catch (error) {
    console.log("------->error", error);
    res.send(error);
  }
});

app.post("/webhook", async (req: Request, res: Response) => {
  try {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;
    const dataId = req.query["data.id"] as string;
    const { type } = req.body;
    if (!xSignature || !xRequestId || !dataId) {
      console.log({ xSignature, xRequestId, dataId });
      throw new Error("faltan datos para la validacion de la notificacion");
    }
    console.log({query:req.query,params:req.params})
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${extraerMarcaTiempo(
      xSignature
    )};`;
    const hmac = createHmac("sha256", SECRETKEYVALIDATION);
    hmac.update(manifest);
    const sha = hmac.digest("hex");
    if (sha !== extraerHash(xSignature)) {
      throw new Error("hash no coincide");
    }

    switch (type) {
      case "payment":
        const result = await payment.get({
          id: dataId,
        });
        console.log({ result });
        res.sendStatus(200);
        break;

      default:
        break;
    }
    
  } catch (error) {
    console.log("------->error", error);
    res.send(error);
  }
});

function extraerMarcaTiempo(xSignature: string): string {
  const partes = xSignature.split(",");
  console.log(partes);
  for (const parte of partes) {
    const [clave, valor] = parte.trim().split("=");
    if (clave === "ts") {
      return valor;
    }
  }
  throw new Error("Falta la marca de tiempo en x-firma");
}
function extraerHash(xSignature: string): string {
  const partes = xSignature.split(",");
  for (const parte of partes) {
    const [clave, valor] = parte.trim().split("=");
    if (clave === "v1") {
      return valor;
    }
  }
  throw new Error("Falta el hash en x-firma");
}
app.listen(3500, () => {
  console.log("Listening on port 3500");
});
