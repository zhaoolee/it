const https = require('https');
const express = require('express');



const app = express()

app.use(express.static('html'))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


const port = 3000;




const key = "5ac2e1ee-****-9d6a36";
const secret = "a666cbf1-****-528b";

// 文档地址 https://www.hs.net/wiki/api/983_gildataastock_v1_commontable_tadingday.html
// 示例访问链接 http://localhost:3000/gildataastock/v1/commontable/tadingday?end_date=2021-03-01&start_date=2021-01-01&secu_market=77

app.get('/gildataastock/v1/commontable/tadingday', (req, res) => {

    console.log('req==>>', req);
    const secu_market = req.query.secu_market;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const Authorization = "Basic " + Buffer.from(key+":"+secret).toString('base64')
    console.log("==Authorization==>>", Authorization);
    const postData = "grant_type=client_credentials";
    let token_req = https.request({
        hostname: 'sandbox.hscloud.cn',
        path: '/oauth2/oauth2/token',
        method: "POST",
        headers : {
            'Authorization': Authorization,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        },
    },  (token_res)=>{
        token_res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            const token_info = JSON.parse(chunk);
            const access_token = token_info["access_token"];
            const token_type = token_info["token_type"]
            // 开始请求
            const  tadingday_post_data = `secu_market=${secu_market}&start_date=${start_date}&end_date=${end_date}`;
            const tadingday_authorization = token_type +" " + access_token;
            console.log('==tadingday_authorization==>>', tadingday_authorization);
            const tadingday_req = https.request({
                method: "POST",
                hostname: 'sandbox.hscloud.cn',
                path: '/gildataastock/v1/commontable/tadingday',
                headers: {
                    "Authorization": tadingday_authorization,
                    'Content-Type' : 'application/x-www-form-urlencoded',
                    'Content-Length': tadingday_post_data.length
                }
            }, (tadingday_res)=>{
                tadingday_res.on('data', (res_data) => {
                    console.log(`BODY: ${res_data}`);
                    res_data = JSON.parse(res_data);
                    console.log('=res_data==>>', res_data)
                    res.send(res_data)
                })
                tadingday_res.on('end', () => {
                    console.log('No more data in response.');
                });
            })
            tadingday_req.write(tadingday_post_data);
            tadingday_req.end();

        });
        token_req.on('end', () => {
            console.log('No more data in response.');
        });
    })
    token_req.write(postData);
    token_req.end();

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


