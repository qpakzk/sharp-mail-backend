var express = require('express');
const nodemailer = require("nodemailer");
const { encrypt } = require('../lib/crypto');
const os = require('os');

var router = express.Router();

router.post('/send', function(req, res, next) {
    const { sender, password, receiver, title, body } = req.body;
    console.log(`sender=${sender}`);
    console.log(`receiver=${receiver}`);
    console.log(`title=${title}`);
    console.log(`body=${body}`);

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

    const encrypted_body = encrypt(body);
    let transporter = nodemailer.createTransport({
        service,
        auth: {
          user: sender_email,
          pass: password,
        },
      });

    const ifaces = os.networkInterfaces();
    let IP_ADDR = '127.0.0.1';
    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(iface => {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                return;
            }
            
            IP_ADDR = iface.address;
            return;
        });
    });

    console.log(`ip address = ${IP_ADDR}`);
    let form_url = `http://${IP_ADDR}:3000/decrypt/`;
    const mail_html = `
	    <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                <p>${encrypted_body}</p>
                <form action=${form_url} target="_blank" method="post">
                    <input type="hidden" name="encrypted" value=${encrypted_body} />
                    <input type="submit" value="Decrypt!" />
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