import React, { useState, useEffect } from 'react';
import { DatePicker, PageHeader, Select, Calendar, Col, Row, Typography } from 'antd';
import moment from 'moment';
import Axios from 'axios';
import { } from 'antd';
import './App.css';
const { RangePicker } = DatePicker;

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      start_date: moment('2019-09-01', 'YYYY-MM-DD'),
      end_date: moment('2019-09-30', 'YYYY-MM-DD'),
      calendar_value: moment('2019-09-01', 'YYYY-MM-DD'),
      secu_market: "71",
      tadingday_data: []

    }

    this.change_secu_market = this.change_secu_market.bind(this);
    this.get_data = this.get_data.bind(this);
    this.range_picker_change = this.range_picker_change.bind(this);
    this.onPanelChange = this.onPanelChange.bind(this);
    this.dateCellRender = this.dateCellRender.bind(this);

  }




  change_secu_market(secu_market) {
    this.setState({
      secu_market
    }, () => {
      this.get_data();
    })
  }

  range_picker_change(date_range) {
    this.setState({
      start_date: date_range[0],
      end_date: date_range[1]
    })
  }



  async get_data() {
    const tadingday_data = (await Axios({
      url: "http://localhost:3100/gildataastock/v1/commontable/tadingday",
      method: "GET",
      params: {
        "start_date": moment(this.state.start_date).format("YYYY-MM-DD"),
        "end_date": moment(this.state.end_date).format("YYYY-MM-DD"),
        "secu_market": this.state.secu_market
      }
    }))['data']['data']

    await new Promise((resolve, reject) => {

      this.setState({
        tadingday_data
      }, () => {
        console.log('获取数据成功==>>', tadingday_data);
        resolve(tadingday_data);
      })
    })

  }

  onPanelChange(value, mode) {

    console.log("value==>>", value, "mode==>>", mode);

    if (mode === "month") {
      const start_date = moment(moment(value).format("YYYY-MM") + "-01", "YYYY-MM-DD");

      const end_date = moment(moment(moment(value).add(1, 'month').format("YYYY-MM") + "-01").subtract(1, "days").format("YYYY-MM-DD"), "YYYY-MM-DD");

      const calendar_value = moment(value)

      console.log('==start_date==>>', start_date);

      console.log('==end_date==>>', end_date);

      this.setState({
        start_date,
        end_date,
        calendar_value
      }, async () => {
        await this.get_data();
      })
    }
  }

  dateCellRender(value) {
    let result = <div>{moment(value).format("DD")}</div>;
    const tadingday_data_json = {}
    this.state.tadingday_data.map((v) => [
      tadingday_data_json[v['trading_date']] = v
    ])


    if (tadingday_data_json[value.format("YYYY-MM-DD")] && tadingday_data_json[value.format("YYYY-MM-DD")]['if_trading_day'] === "是") {
      result = <div style={{ backgroundColor: '#1C7947', color: "#FFFFFF", textAlign: "right", padding: 2 }}>工 作</div>;
    }

    if (tadingday_data_json[value.format("YYYY-MM-DD")] && tadingday_data_json[value.format("YYYY-MM-DD")]['if_trading_day'] === "否") {

      result = <div style={{ backgroundColor: '#FFFD95', textAlign: "right", padding: 2 }}>休 息</div>;
    }

    return result;




  }

  componentDidMount() {
    this.get_data()
  }


  render() {
    return <div className="App">

      <Typography.Title style={{textAlign: "center"}} level={4}>交易日批量查询(React版) 恒生交易日历查询Demo</Typography.Title>
      <div style={{padding: 8}}>
        <Typography.Title level={4}>选择交易市场</Typography.Title>
        <Select style={{ width: "200px" }}
          defaultValue={this.state.secu_market}
          onChange={this.change_secu_market}
        >
          <option value="71" selected>柜台交易市场</option>
          <option value="72">香港联交所</option>
          <option value="77">美国纳斯达克证券交易所</option>
          <option value="83">沪深证券交易所</option>
          <option value="89">银行间债券市场</option>
        </Select>
      </div>


      <Calendar
        key={(this.state.tadingday_data.length > 0 ? (this.state.tadingday_data[0]['trading_date'] +this.state.tadingday_data[0]['secu_market'] + this.state.tadingday_data.length) : "0")}
        defaultValue={this.state.defualtValue}
        value={this.state.calendar_value}
        onPanelChange={this.onPanelChange}
        dateCellRender={this.dateCellRender}
        headerRender={({ value, type, onChange, onTypeChange }) => {
          const start = 0;
          const end = 12;
          const monthOptions = [];
          const current = value.clone();
          const localeData = value.localeData();
          const months = [];
          for (let i = 0; i < 12; i++) {
            current.month(i);
            months.push(localeData.monthsShort(current));
          }

          for (let index = start; index < end; index++) {
            monthOptions.push(
              <Select.Option className="month-item" key={`${index}`}>
                {months[index]}
              </Select.Option>,
            );
          }
          const month = value.month();

          const year = value.year();
          const options = [];
          for (let i = year - 10; i < year + 10; i += 1) {
            options.push(
              <Select.Option key={i} value={i} className="year-item">
                {i}
              </Select.Option>,
            );
          }
          return (
            <div style={{ padding: 8 }}>
              <Typography.Title level={4}>选择日期</Typography.Title>
              <Row gutter={8}>
                <Col>
                  <Select

                    dropdownMatchSelectWidth={false}
                    className="my-year-select"
                    onChange={newYear => {
                      const now = value.clone().year(newYear);
                      onChange(now);
                    }}
                    value={String(year)}
                  >
                    {options}
                  </Select>
                </Col>
                <Col>
                  <Select
                    dropdownMatchSelectWidth={false}
                    value={String(month)}
                    onChange={selectedMonth => {
                      const newValue = value.clone();
                      newValue.month(parseInt(selectedMonth, 10));
                      onChange(newValue);
                    }}
                  >
                    {monthOptions}
                  </Select>
                </Col>
              </Row>
            </div>
          );
        }}
      />
    </div>
  }
}

export default App;
