const https = require('https');
// key 和 secret 要通过注册恒生云获取
const key = "*****";
const secret = "*****";
// 获得 access_token 文档地址  https://www.hs.net/doc/100500_200550.html
const Authorization = "Basic " + Buffer.from(key+":"+secret).toString('base64');
console.log("==Authorization==>>", Authorization);
const postData = "grant_type=client_credentials";
const token_req = https.request({
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
        const token_type = token_info["token_type"];
        console.log('token_info==>>', token_info);
        console.log('access_token==>>', access_token);
        console.log('token_type==>>', token_type);
    }
)})
token_req.write(postData);
token_req.end();