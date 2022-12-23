/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input, Select } from "antd";
import QuestionService from "../../../../../utilities/apiServices/QuestionService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { onBack } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const question = useRef(props.question || {});

  function onInputChange(e) {
    const { value, name } = e.target;
    question.current[name] = value;
    console.log(question.current);
  }

  function handleSaveQuestion() {
    setIsSaving(true);
    QuestionService.update(question.id, question.current)
      .then(res => {
        question.current = res.data;
        setIsSaving(false);
      })
      .catch(error => {
        setIsSaving(false);
      });
  }

  return (
    <>
      <Row style={{ marginTop: "5px" }}>
        <Col span={24}>
          <Row>
            <Col span={12}>
              <Input
                type="text"
                name="text"
                placeholder="Enter your question here"
                defaultValue={question.current?.text}
                onChange={onInputChange}
              />
            </Col>
            <Col span={6}>
              <Select
                defaultValue={true}
                style={{ width: "100%" }}
                onChange={onInputChange}
                options={[
                  {
                    value: true,
                    label: "There is one correct answer"
                  },
                  {
                    value: false,
                    label: "There are possibly more correct answers"
                  }
                ]}
              />
            </Col>
            <Col span={6}>
              <Button type="primary" danger>
                {"Delete"}
              </Button>
              <Button type="primary">{"Save"}</Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
}
