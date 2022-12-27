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
  const { setVisiable, onComplete } = props;
  const [isSaving, setIsSaving] = useState(false);
  const quiz = useRef({});

  function onInputChange(e) {
    const { value, name } = e.target;
    quiz.current[name] = value;
  }

  function handleSave() {
    setIsSaving(true);
    QuizService.create(quiz.current)
      .then(res => {
        //const quizs = res.data;
        setIsSaving(false);
        setVisiable(false);
        onComplete(quiz.current);
      })
      .catch(error => {
        setIsSaving(false);
      });
  }

  function handleClose() {
    quiz.current = {};
    setVisiable(false);
  }

  return (
    <Modal
      className="popup-create-quiz"
      title="Create Quiz"
      centered
      open={true}
      width={700}
      okText={t("Create")}
      cancelText={t("Close")}
      onOk={handleSave}
      onCancel={handleClose}
      confirmLoading={isSaving}
    >
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal">
        <Form.Item name="title" label={t("content.POPUP_CREATE_QUIZ__TITLE_LABEL")} rules={[{ required: true }]}>
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
