var express = require('express');
const nodemailer = require("nodemailer");
const { encrypt } = require('../lib/crypto');
const os = require('os');
const { registerUser } = require('../fabric/user');
const  { mint } = require('../fabric/invoke');

var router = express.Router();

const tokenType = 'mail';

router.post('/send', function(req, res, next) {
    const { sender, password, receiver, title, body } = req.body;
    console.log(`sender=${sender}`);
    console.log(`receiver=${receiver}`);
    console.log(`title=${title}`);
    console.log(`body=${body}`);

    registerUser(sender);
    registerUser(receiver);

    let service = "";
    if (sender.includes('#') && sender.includes('.')) {
        service = sender.split("#")[1].split(".")[0];
    }
    else {
        const error = new Error('Wrong string');
        return next(error);
    }

    const sender_email = sender.replace("#", "@");
    const receiver_email = receiver.replace("#", "@");

    console.log(`sender=${sender_email}, receiver=${receiver_email}`);

    const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    
    const xattr = {
        'from': sender,
        'to': receiver,
        'date': new Date(timestamp),
        'key': key,
        'visited': false
    };

    const uri = {
        'path': '',
        'hash': '',
    };

    console.info('==== mint ====');
    console.log(`tokenId=${timestamp},tokenType=${tokenType},owner=${receiver},xattr=${JSON.stringify(xattr)},uri=${JSON.stringify(uri)}`);
    mint(timestamp, tokenType, receiver, xattr, uri)
        .then(_ => {
            console.info('==== mint success ====');
        })
        .catch(err => {
            console.error('mint fail');
        });
    
    const encrypted_body = encrypt(body, key);
    let transporter = nodemailer.createTransport({
        service,
        auth: {
          user: sender_email,
          pass: password,
        },
      });

    let IP_ADDR = '127.0.0.1';
    const { ens33 } = os.networkInterfaces();

    ens33.forEach(iface => {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
        }

        IP_ADDR = iface.address;
        return;
    });

    console.log(`ip address = ${IP_ADDR}`);
    const decrypt_url = `http://${IP_ADDR}:3000/decrypt/`;
    const verify_url = `http://${IP_ADDR}:3000/verify/`;
    const mail_html = `
	    <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                <p>${encrypted_body}</p>
                <form action=${decrypt_url} target="_blank" method="post">
                    <input type="hidden" name="encrypted" value=${encrypted_body} />
                    <input type="hidden" name="tokenid" value=${timestamp} />
                    <input type="hidden" name="receiver" value=${receiver} />
                    <input type="submit" value="Decrypt!" />
                </form>
                <form action=${verify_url} target="_blank" method="post">
                    <input type="hidden" name="tokenid" value=${timestamp} />
                    <input type="hidden" name="receiver" value=${receiver} />
                    <input type="submit" value="Verify!" />
                </form>
            </body>
        </html>`;

    const mailOptions = {
        from: sender_email,
        to: receiver_email,
        subject: title,
        text: encrypted_body,
        html: mail_html,
    };
        
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return next(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.redirect('/');
});

module.exports = router;