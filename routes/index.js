var express = require('express');
const axios = require('axios');
const { decrypt } = require('../lib/crypto');
const { query } = require('../fabric/query');
const e = require('express');
const f = require('session-file-store');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '# Mail Service' });
});

const URL = 'http://141.223.83.35:8080/assets/index';
router.get('/hello', function(req, res, next) {
  axios({
    method: 'get',
    url: URL,
  })
    .then(response => {
      console.log(response);
      res.send('success');
    })
    .catch(error => {
      console.error(error);
      next(error);
    })
});

router.post('/decrypt', async (req, res) => {
  const { encrypted, tokenid, receiver } = req.body;

  try {
    const token = await query(receiver, tokenid);
    const tokenObj = JSON.parse(token);
    console.info('==== token ====');
    console.log(tokenObj);
    const { key } = tokenObj.xattr;
    const decrypted_body = decrypt(encrypted, key);
    console.info('==== decryted body ====');
    console.log(decrypted_body);

    req.session.encrypted = encrypted;
    req.session.decrypted = decrypted_body;
    res.redirect('/decrypt');

    // let html = `
    //   <h1>Decypt the Mail Content</h1>
    //   <p>[Encrypted Body] ${encrypted}</p>
    //   <p>[Decrypted Body] ${decrypted_body}</p>
    // `;
    // res.send(html);
  } catch (err) {
    console.error(err);
    res.json(err);
  };
});

router.get('/decrypt', (req, res) => {
  let html = `
      <h1>Decypt the Mail Content</h1>
      <p>[Encrypted Body] ${req.session.encrypted}</p>
      <p>[Decrypted Body] ${req.session.decrypted}</p>
    `;
  res.send(html);
});

router.post('/verify', async (req, res) => {
  const { tokenid, receiver } = req.body;
  try {
    const token = await query(receiver, tokenid);
    const tokenObj = JSON.parse(token);
    console.info('==== token ====');
    console.log(tokenObj);
    const { from, to, date } = tokenObj.xattr;
    req.session.from = from;
    req.session.to = to;
    req.session.date = date;
    req.session.tokenid = tokenid;
    res.redirect('/verify');
    // let html = `
    //   <h1>Certificate</h1>
    //   <p>Sender: ${from}</p>
    //   <p>Receiver: ${to}</p>
    //   <p>Creation Date: ${date}</p>
    //   <p>Token ID: ${tokenid}</p>
    // `;
    // res.send(html);
  } catch(error) {
    console.error(error);
    res.json(error);
  }
});

router.get('/verify', (req, res) => {
  const { from, to, date, tokenid } = req.session;
  let html = `
  <h1>Certificate</h1>
  <p>Sender: ${from}</p>
  <p>Receiver: ${to}</p>
  <p>Creation Date: ${date}</p>
  <p>Token ID: ${tokenid}</p>
  `;
  res.send(html);
});

module.exports = router;
