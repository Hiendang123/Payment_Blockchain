const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const path = require("path");
const session = require("express-session");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({ secret: "pirate-secret", resave: false, saveUninitialized: true })
);

const API_KEY = "49740148-6809-4e3d-a3ec-9e9660cfd2b4";
const WEBHOOK_SECRET = "623996be-b56f-4c00-91aa-0509635e2c49";

// Pirate products
const products = [
  { id: 1, name: "Golden Doubloon", price: 20.0 },
  { id: 2, name: "Silver Cutlass", price: 35.0 },
];

// Helper to fetch crypto price
async function getCryptoPrices() {
  // Coinbase API for spot price
  const [btc, eth] = await Promise.all([
    axios.get("https://api.coinbase.com/v2/prices/spot?currency=USD"),
    axios.get("https://api.coinbase.com/v2/prices/ETH-USD/spot"),
  ]);
  return {
    BTC: parseFloat(btc.data.data.amount),
    ETH: parseFloat(eth.data.data.amount),
  };
}

app.get("/", async (req, res) => {
  const crypto = await getCryptoPrices();
  res.render("index", { products, crypto });
});

app.post("/add-to-cart", (req, res) => {
  const { productId } = req.body;
  const product = products.find((p) => p.id == productId);
  if (!product) return res.redirect("/");
  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push(product);
  res.redirect("/cart");
});

app.get("/cart", async (req, res) => {
  const cart = req.session.cart || [];
  const crypto = await getCryptoPrices();
  let total = cart.reduce((sum, p) => sum + p.price, 0);
  res.render("cart", { cart, total, crypto });
});

app.post("/create-charge", async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.send("Yer cart be empty, matey!");
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const wallet = req.body.wallet;
  if (!wallet) return res.send("Ye must enter yer wallet address, matey!");
  try {
    const response = await axios.post(
      "https://api.commerce.coinbase.com/charges",
      {
        name: "Pirate Booty",
        description: `Booty: ${cart
          .map((p) => p.name)
          .join(", ")} | Wallet: ${wallet}`,
        pricing_type: "fixed_price",
        local_price: {
          amount: total.toFixed(2),
          currency: "USD",
        },
      },
      {
        headers: {
          "X-CC-Api-Key": API_KEY,
          "X-CC-Version": "2018-03-22",
          "Content-Type": "application/json",
        },
      }
    );
    req.session.cart = [];
    res.redirect(response.data.data.hosted_url);
  } catch (err) {
    res.send("Arrr! There be an error creatin' the charge.");
  }
});

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-cc-webhook-signature"];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(payload, "utf8");
  const computedSignature = hmac.digest("hex");

  if (signature === computedSignature) {
    // Handle the event, matey!
    console.log("Webhook verified:", req.body.event.type);
    res.status(200).send("Ahoy! Webhook received.");
  } else {
    res.status(400).send("Avast! Invalid signature.");
  }
});

app.listen(3000, () => {
  console.log("Aye! Server be runnin' on port 3000");
});
