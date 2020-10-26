import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Space,
  Select,
  TimePicker,
  Row,
  Col,
  message,
  Card,
  Input,
  DatePicker,
} from 'antd';
const Option = Select.Option;
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { connect, Dispatch } from 'umi';
import { StateType } from '../../model';

import { saveActivitying } from '@/services/activity';
import { FormInstance } from 'antd/lib/form/hooks/useForm';
import moment from 'moment';
import { API } from '@/services/API';
import { uuid } from '@/helpers/uuid';
import UploadComponent from '@/components/Upload';

interface Step3Props {
  data?: StateType['step'];
  dispatch?: Dispatch;
  submitting?: boolean;
}

const FormItemTitleLayoutSpan = 8;
const FormItemLayoutSpan = 11;
const FormItemLayoutOffset = 0;
const FormRowLayoutSpan = 12;

const Step3: React.FC<Step3Props> = (props) => {
  const [listFrom, setListFrom] = useState<FormInstance[]>([]);
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ schedules: [{}] });
  }, []);
  const { data, dispatch, submitting } = props;
  if (!data) {
    return null;
  }
  const { getFieldsValue } = form;
  const onPrev = () => {
    if (dispatch) {
      const values = getFieldsValue();
      dispatch({
        type: 'addteambuilding/saveStepFormData',
        payload: {
          ...data,
          ...values,
        },
      });
      dispatch({
        type: 'addteambuilding/saveCurrentStep',
        payload: 'feature',
      });
    }
  };
  const onValidateForm = async () => {
    const values = await getFieldsValue();
    if (dispatch) {
      const planPromises = listFrom.map(async (form) => {
        const plan = await form.getFieldsValue();
        return plan.plans.map((plan: API.TeamBuilding_Schedule_Item) => {
          return { ...plan, time: moment(plan.time).valueOf() };
        });
      });
      const plans = await Promise.all(planPromises);
      const schedules = values.schedules.map(
        (schedule: API.TeamBuilding_Schedule, index: number) => {
          const { title, sub_title, date } = schedule;
          const items = plans[index];
          return { title, sub_title, date: moment(date).valueOf(), items };
        },
      );
      const { hold_people = {}, feature = [], ...others }: any = data;
      const [first] = feature;
      const params: any = {
        ...others,
        ...hold_people,
        feature: first,
        schedules,
        sort: 1,
        status: 1,
      };
      console.log(params);
      await saveActivitying(params);
      dispatch({
        type: 'addteambuilding/submitStepForm',
        payload: params,
      });
    }
  };

  const handleListFrom = (key: string, form: FormInstance) => {
    listFrom.push(form);
    setListFrom(listFrom.slice());
  };

  return (
    <Form
      style={{ height: '100%', marginTop: 40 }}
      name={'plan'}
      form={form}
      layout="vertical"
      autoComplete="off"
      hideRequiredMark={true}
    >
      <Form.List name={'schedules'}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              console.log(field);
              return (
                <Card
                  key={field.key}
                  title={`方案${index + 1}`}
                  style={{ marginTop: 20 }}
                  extra={
                    <Space align={'center'}>
                      <PlusOutlined onClick={() => add()} />
                      <MinusCircleOutlined
                        onClick={() => {
                          if (fields.length !== 1) {
                            remove(field.name);
                            listFrom.splice(field.name, 1);
                            setListFrom(listFrom.slice());
                          } else {
                            message.warning('至少保留一个');
                          }
                        }}
                      />
                    </Space>
                  }
                >
                  <Card
                    type="inner"
                    title={
                      <Row
                        key={field.key}
                        gutter={FormRowLayoutSpan}
                        style={{
                          display: 'flex',
                          marginBottom: 8,
                          justifyContent: 'center',
                          flex: 1,
                        }}
                      >
                        <Col span={FormItemTitleLayoutSpan} offset={FormItemLayoutOffset}>
                          <Form.Item
                            {...field}
                            label="标题"
                            name={[field.name, 'title']}
                            fieldKey={[field.fieldKey, 'title']}
                            rules={[{ required: true, message: '请输入标题' }]}
                          >
                            <Input placeholder={'请输入标题'} />
                          </Form.Item>
                        </Col>
                        <Col span={FormItemTitleLayoutSpan} offset={FormItemLayoutOffset}>
                          <Form.Item
                            {...field}
                            label="描述"
                            name={[field.name, 'sub_title']}
                            fieldKey={[field.fieldKey, 'sub_title']}
                            rules={[{ required: true, message: '请输入描述' }]}
                          >
                            <Input placeholder={'请输入描述'} />
                          </Form.Item>
                        </Col>
                        <Col span={FormItemTitleLayoutSpan} offset={FormItemLayoutOffset}>
                          <Form.Item
                            {...field}
                            label="日期"
                            name={[field.name, 'date']}
                            fieldKey={[field.fieldKey, 'date']}
                            rules={[{ required: true, message: '请选择时间' }]}
                          >
                            <DatePicker style={{ width: '100%' }} format={'YYYY-MM-DD'} />
                          </Form.Item>
                        </Col>
                      </Row>
                    }
                  >
                    <FormItemList uuidKey={uuid(8)} onUpdateFrom={handleListFrom} />
                  </Card>
                </Card>
              );
            })}
          </>
        )}
      </Form.List>
      <Row>
        <Space
          style={{
            marginTop: 20,
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'center',
            flex: 1,
          }}
          align={'baseline'}
        >
          <Button onClick={onPrev} style={{ marginRight: 8 }}>
            上一步
          </Button>
          <Button type="primary" onClick={onValidateForm} loading={submitting}>
            提交
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

interface FormItemListProps {
  uuidKey: string;
  value?: any;
  onUpdateFrom: (key: string, form: FormInstance) => void;
}

const FormItemList = (props: FormItemListProps) => {
  const { uuidKey, onUpdateFrom } = props;
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ plans: [{}] });
    onUpdateFrom(uuidKey, form);
  }, []);
  return (
    <Form
      style={{ height: '100%' }}
      name={'plan'}
      form={form}
      layout="vertical"
      autoComplete="off"
      hideRequiredMark={true}
    >
      <Form.List name={'plans'}>
        {(fields, { add, remove }) => {
          return (
            <>
              {fields.map((field) => (
                <div key={field.key}>
                  <Row
                    gutter={FormRowLayoutSpan}
                    style={{
                      display: 'flex',
                      marginBottom: 8,
                      justifyContent: 'center',
                      flex: 1,
                    }}
                  >
                    <Col span={FormItemLayoutSpan} offset={FormItemLayoutOffset}>
                      <Form.Item
                        {...field}
                        label="天数"
                        name={[field.name, 'day']}
                        fieldKey={[field.fieldKey, 'day']}
                        rules={[{ required: true, message: '请选择天数' }]}
                      >
                        <Select placeholder={'请选择天数'}>
                          <Option value={1}>第一天</Option>
                          <Option value={2}>第二天</Option>
                          <Option value={3}>第三天</Option>
                          <Option value={4}>第四天</Option>
                          <Option value={5}>第五天</Option>
                          <Option value={6}>第六天</Option>
                          <Option value={7}>第七天</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={FormItemLayoutSpan} offset={FormItemLayoutOffset}>
                      <Form.Item
                        {...field}
                        label="具体时间"
                        name={[field.name, 'time']}
                        fieldKey={[field.fieldKey, 'time']}
                        rules={[{ required: true, message: '请选择时间' }]}
                      >
                        <TimePicker style={{ width: '100%' }} format={'HH:mm'} />
                      </Form.Item>
                    </Col>
                    <Space align={'center'}>
                      <PlusOutlined onClick={() => add()} />
                      <MinusCircleOutlined
                        onClick={() => {
                          if (fields.length !== 1) {
                            remove(field.name);
                          } else {
                            message.warning('至少保留一个');
                          }
                        }}
                      />
                    </Space>
                  </Row>
                  <Row gutter={FormRowLayoutSpan}>
                    <Col span={FormItemLayoutSpan} offset={FormItemLayoutOffset}>
                      <Form.Item
                        {...field}
                        label="图片"
                        name={[field.name, 'pictures']}
                        fieldKey={[field.fieldKey, 'pictures']}
                        rules={[{ required: true, message: '请选择图片' }]}
                      >
                        <UploadComponent showUploadList={true} multiple={true} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
            </>
          );
        }}
      </Form.List>
    </Form>
  );
};

export default connect(
  ({
    addteambuilding,
    loading,
  }: {
    addteambuilding: StateType;
    loading: {
      effects: { [key: string]: boolean };
    };
  }) => ({
    submitting: loading.effects['addteambuilding/submitStepForm'],
    data: addteambuilding.step,
  }),
)(Step3);