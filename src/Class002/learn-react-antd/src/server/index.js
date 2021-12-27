const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors')
// 初始化数据库
const db = require('better-sqlite3')(path.join(__dirname, "data", "tadingday.sqlite"));
// 新建数据表
//  secu_market: 证券市场  if_trading_day:是否交易日 if_week_end:是否周末 if_month_end:是否月末  if_quarter_end:是否季末   if_year_end:是否年末 trading_date:交易日期
db.exec(`
    CREATE TABLE IF NOT EXISTS tadingday_info (
        secu_market VARCHAR(50),
        if_trading_day VARCHAR(10),
        if_week_end VARCHAR(10), 
        if_month_end VARCHAR(10), 
        if_quarter_end VARCHAR(10),  
        if_year_end VARCHAR(10), 
        trading_date VARCHAR(16), 
        request_secu_market VARCHAR(16),
        PRIMARY KEY(request_secu_market, trading_date)
    );
`);
// 从本地数据库取数据
const select_tadingday_info = db.prepare(`select * from tadingday_info 
    WHERE 
    trading_date >= @start_date AND 
    trading_date <= @end_date AND 
    request_secu_market = @request_secu_market;`
);
// 往本地数据库插入数据
const insert_tadingday_info = db.prepare(`INSERT INTO tadingday_info (
    secu_market,
    if_trading_day,
    if_week_end, 
    if_month_end, 
    if_quarter_end,  
    if_year_end, 
    trading_date,
    request_secu_market
) values (
    @secu_market,
    @if_trading_day,
    @if_week_end, 
    @if_month_end, 
    @if_quarter_end,  
    @if_year_end, 
    @trading_date,
    @request_secu_market
);`);


const app = express()

app.use(cors())

app.use(express.static('html'))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


const port = 3100;

const key = "5ac2e1ee-789e-4d6b-a52d-f533b99d6a36";
const secret = "a666cbf1-9137-4ade-81e1-6a65d43f528b";



// 文档地址 https://www.hs.net/wiki/api/983_gildataastock_v1_commontable_tadingday.html
// 示例访问链接 http://localhost:3100/gildataastock/v1/commontable/tadingday?end_date=2021-03-01&start_date=2021-01-01&secu_market=77

async function get_token() {
    const tadingday_authorization = await new Promise((resolve, reject) => {
        const Authorization = "Basic " + Buffer.from(key + ":" + secret).toString('base64')
        console.log("==Authorization==>>", Authorization);
        const postData = "grant_type=client_credentials";
        let token_res_data = "";
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
                token_res_data = token_res_data + chunk;
            });
            token_res.on('end', () => {

                console.log(`BODY: ${token_res_data}`);



                const token_info = JSON.parse(token_res_data);

                if (token_info["access_token"]) {

                    const access_token = token_info["access_token"];
                    const token_type = token_info["token_type"]
                    const tadingday_authorization = token_type + " " + access_token;
                    console.log('==tadingday_authorization==>>', tadingday_authorization);
                    resolve(tadingday_authorization);


                } else (

                    resolve("")


                )


            })

        })

        token_req.on('error', (e) => {
            resolve("")

        })
        token_req.write(postData);
        token_req.end();
    })

    return tadingday_authorization;
}
app.get('/gildataastock/v1/commontable/tadingday', async (req, res) => {

    const secu_market = req.query.secu_market;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const tadingday_authorization = await get_token();

    if (tadingday_authorization.length > 0) {

        // 开始请求
        const tadingday_post_data = `secu_market=${secu_market}&start_date=${start_date}&end_date=${end_date}`;
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

            console.log('statusCode:', res.statusCode);

            tadingday_res.on('data', (res_data) => {
                tadingday_res_body = tadingday_res_body + res_data;
            })

            tadingday_res.on('end', () => {
                console.log(`BODY: ${tadingday_res_body}`);
                console.log('--Object.keys(tadingday_res_body)-->>', tadingday_res_body, Object.keys(JSON.parse(tadingday_res_body)),  Object.keys(JSON.parse(tadingday_res_body)).indexOf('error'));

                if (Object.keys(JSON.parse(tadingday_res_body)).indexOf('error') > -1) {

                    

                    let local_data_result = select_data({ "start_date": start_date, "end_date": end_date, "request_secu_market": secu_market })

                    res.send({ data: local_data_result })

                } else {

                    tadingday_res_body = JSON.parse(tadingday_res_body);
                    res.send(tadingday_res_body)
    
                    // 存入数据库
    
                    tadingday_res_body["data"].map((value) => {
                        value['request_secu_market'] = secu_market
                        sava_data(value)
                    })



                }




            })

        })

        tadingday_req.on('error', (e) => {
            console.log(e);
        })

        tadingday_req.write(tadingday_post_data);
        tadingday_req.end();

    } else {

        let local_data_result = select_data({ "start_date": start_date, "end_date": end_date, "request_secu_market": secu_market })

        res.send({ data: local_data_result })

    }

})


// 使用sqlite数据库存储请求来的数据

function sava_data(tadingday_info_atom) {
    const { secu_market, if_trading_day, if_week_end, if_month_end, if_quarter_end, if_year_end, trading_date, request_secu_market } = tadingday_info_atom;



    try {

        insert_tadingday_info.run(
            {
                "secu_market": secu_market,
                "if_trading_day": if_trading_day,
                "if_week_end": if_week_end,
                "if_month_end": if_month_end,
                "if_quarter_end": if_quarter_end,
                "if_year_end": if_year_end,
                "trading_date": trading_date,
                "request_secu_market": request_secu_market
            }
        );

    } catch (e) {
        // console.log(e);
    }

}

// 从本地数据库获取数据
function select_data(value) {
    const { start_date, end_date, request_secu_market } = value;

    console.log("==从本地数据库取数据==")

    try {

        const result_data = select_tadingday_info.all(
            {
                "start_date": start_date,
                "end_date": end_date,
                "request_secu_market": request_secu_market
            }
        );
        console.log('=result_data=>>', result_data);
        return result_data
    } catch (e) {
        // console.log(e);
    }

}


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


