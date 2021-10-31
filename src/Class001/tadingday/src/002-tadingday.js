const https = require('https');

const key = "*************";
const secret = "*************";

// 查看代码前,请仔细阅读文档 文档地址 https://www.hs.net/wiki/api/983_gildataastock_v1_commontable_tadingday.html
const Authorization = "Basic " + Buffer.from(key + ":" + secret).toString('base64')
console.log("==Authorization==>>", Authorization);
const postData = "grant_type=client_credentials";
let token_req = https.request({
    hostname: 'sandbox.hscloud.cn',
    path: '/oauth2/oauth2/token',
    method: "POST",
    headers: {
        'Authorization': Authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    },
}, (token_res) => {
    token_res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
        const token_info = JSON.parse(chunk);
        const access_token = token_info["access_token"];
        const token_type = token_info["token_type"]
        // 开始请求
        //  secu_market=77 77代指美国纳斯达克证券交易所 , start_data=2018-01-01 代指开始时间为2018-01-01, end_date=2020-01-05代指结束时间为2020-01-05
        const tadingday_post_data = `secu_market=77&start_date=2018-01-01&end_date=2020-01-05`;
        const tadingday_authorization = token_type + " " + access_token;
        let tadingday_res_body = "";
        const tadingday_req = https.request({
            method: "POST",
            hostname: 'sandbox.hscloud.cn',
            path: '/gildataastock/v1/commontable/tadingday',
            headers: {
                "Authorization": tadingday_authorization,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': tadingday_post_data.length
            }
        }, (tadingday_res) => {
            // 由于返回的数据量过于庞大, 服务器只能将数据分段返回给我们, 我们每次收到分段都会触发data事件, 于是我们将每次返回的数据累加起来
            tadingday_res.on('data', (res_data) => {
                tadingday_res_body = tadingday_res_body + res_data;
            })
            // 当程序触发 end事件时, 我们将已经获得的数据打印到终端上
            tadingday_res.on('end', ()=>{
                console.log(tadingday_res_body);
            })
        })
        tadingday_req.write(tadingday_post_data);
        tadingday_req.end();
    });
})
token_req.write(postData);
token_req.end();