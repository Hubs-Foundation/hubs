/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Modal, Form, Input } from "antd";
import QuizService from "../../../../../../utilities/apiServices/QuizService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  toast.configure();
  const { setVisiable, onComplete } = props;
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();

  function onInputChange(e) {
    const { value, name } = e.target;
    form.setFieldValue(name, value);
  }

  function handleSave() {
    setIsSaving(true);
    form
      .validateFields()
      .then(result => {
        QuizService.create(form.getFieldsValue())
          .then(res => {
            setIsSaving(false);
            setVisiable(false);
            onComplete(res.data);
          })
          .catch(error => {
            console.log(error);
            toast.error("Create quiz error", { autoClose: 2000 });
            setIsSaving(false);
          });
      })
      .catch(error => {
        setIsSaving(false);
      });
  }

  function handleClose() {
    form.resetFields();
    setVisiable(false);
  }

  return (
    <Modal
      className="popup-create-quiz"
      title="Create Quiz"
      centered
      open={true}
      width={700}
      confirmLoading={isSaving}
      onCancel={handleClose}
      footer={[
        <Button key="close" form="form-create-quiz" type="default" htmlType="reset" onClick={handleClose}>
          {"Close"}
        </Button>,
        <Button
          key="save"
          form="form-create-quiz"
          type="primary"
          htmlType="submit"
          onClick={handleSave}
          loading={isSaving}
        >
          {"Save"}
        </Button>
      ]}
    >
      <Form id="form-create-quiz" form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal">
        <Form.Item
          name="title"
          label={t("content.POPUP_CREATE_QUIZ__TITLE_LABEL")}
          rules={[{ required: true, message: "Title must be not empty" }]}
        >
          <Input type="text" name="title" placeholder="Enter quiz title" onChange={onInputChange} />
        </Form.Item>
        <Form.Item name="introduction" label={t("content.POPUP_CREATE_QUIZ__INTRODUCTION_LABEL")}>
          <Input type="text" name="introduction" placeholder="Enter quiz introduction" onChange={onInputChange} />
        </Form.Item>
        <Form.Item name="description" label={t("content.POPUP_CREATE_QUIZ__DESCRIPTION_LABEL")}>
          <Input type="text" name="description" placeholder="Enter quiz description" onChange={onInputChange} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
