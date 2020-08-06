var express = require('express');
const axios = require('axios');
const { decrypt } = require('../lib/crypto');

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

router.post('/decrypt', (req, res) => {
  const { x_encrypted } = req.body;
  const decrypted_body = decrypt(x_encrypted);
  console.log(decrypted_body);
  res.send(decrypted_body);
});

module.exports = router;
