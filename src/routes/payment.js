import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import Base64 from 'crypto-js/enc-base64.js';
import hmacSHA256 from 'crypto-js/hmac-sha256.js';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();
const router = express.Router();
const { LINEPAY_CHANNELID, LINEPAY_SECRET, LINEPAY_VERSION, LINEPAY_SITE, HOST_URL, LINEPAY_RETURN_CONFIRM_URL, LINEPAY_RETURN_CANCEL_URL } = process.env;

function createSignature(uri, orders) {
  const nonce = parseInt(new Date().getTime() / 1000);
  const string = `${LINEPAY_SECRET}/${LINEPAY_VERSION}${uri}${JSON.stringify(orders)}${nonce}`;
  const signature = Base64.stringify(hmacSHA256(string, LINEPAY_SECRET));
  const headers = {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': LINEPAY_CHANNELID,
    'X-LINE-Authorization-Nonce': nonce,
    'X-LINE-Authorization': signature
  };
  return headers;
}

const orders = {}
let productAmount
let productCurrency
let level
let user_Id
router.post('/', async (req, res) => {
  try {
    const { amount, currency, packages, userId } = req.body;
    productAmount = amount;
    productCurrency = currency;
    level = packages[0].products[0].name
    user_Id = userId
    const order = {
      amount,
      currency,
      packages,
      orderId: parseInt(new Date().getTime() / 1000),
      redirectUrls: {
        confirmUrl: `${LINEPAY_RETURN_CONFIRM_URL}`,
        cancelUrl: `${LINEPAY_RETURN_CANCEL_URL}`
      }
    }
    orders[order.orderId] = order;
    const uri = '/payments/request'
    const headers = createSignature(uri, order);
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`
    const linePayRes = await axios.post(url, order, { headers });
    
    if(linePayRes?.data?.returnCode === '0000') {
      res.json({ redirectUrl: linePayRes?.data?.info.paymentUrl.web })
    }
  } catch (error) {
    res.json({
      message: error.message
    })
  }
})

router.get('/confirm', async (req, res) => {
  try {
    const { transactionId } = req.query 
    const linePayBody = {
      amount: productAmount,
      currency: productCurrency,
    }
    const uri = `/payments/${transactionId}/confirm`
    const headers = createSignature(uri, linePayBody);
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`
    const linePayRes = await axios.post(url, linePayBody, { headers });
  
    if (linePayRes?.data?.returnCode === '0000') {
      res.redirect(`${HOST_URL}/member?order=${transactionId}`);
    } 
    await prisma.users.update({
      where: { id: parseInt(user_Id) },
      data: {
        ...(level && { level }),
      }
    })
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
})


export { router }