var express = require('express');
const axios = require('axios');
const { decrypt } = require('../lib/crypto');
const { query } = require('../fabric/query');
const e = require('express');

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

    let html = `
      <h1>Decypt the Mail Content</h1>
      <p>[Encrypted Body] ${encrypted}</p>
      <p>[Decrypted Body] ${decrypted_body}</p>
    `;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.json(err);
  };
});

router.post('/verify', async (req, res) => {
  const { tokenid, receiver } = req.body;
  try {
    const token = await query(receiver, tokenid);
    const tokenObj = JSON.parse(token);
    console.info('==== token ====');
    console.log(tokenObj);
    const { from, to, date } = tokenObj.xattr;
    let html = `
      <h1>Certificate</h1>
      <p>Sender: ${from}</p>
      <p>Receiver: ${to}</p>
      <p>Creation Date: ${date}</p>
      <p>Token ID: ${tokenid}</p>
    `;
    res.send(html);
  } catch(error) {
    console.error(error);
    res.json(error);
  }
});

module.exports = router;
