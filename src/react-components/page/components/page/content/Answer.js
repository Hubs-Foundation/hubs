/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input, Select, Switch, Card } from "antd";
import QuestionService from "../../../../../utilities/apiServices/QuestionService";
import AnswerService from "../../../../../utilities/apiServices/AnswerService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { onDelete, onChooseCorrectAnswer } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveAnswerSubmiting, setIsSaveAnswerSubmiting] = useState(false);
  const [isDeleteAnswerSubmiting, setIsDeleteAnswerSubmiting] = useState(false);
  const [answer, setAnswer] = useState(props.answer || {});

  function onInputChange(e) {
    const { value, name } = e.target;
    if (name == "isCorrectAnswer" && onChooseCorrectAnswer) {
      onChooseCorrectAnswer(answer);
    } else {
      setAnswer({
        ...answer,
        [name]: value
      });
    }
  }

  function handleSaveAnswer() {
    setIsSaveAnswerSubmiting(true);
    AnswerService.update(answer.id, answer)
      .then(res => {
        setAnswer({
          ...res.data
        });
        setIsSaveAnswerSubmiting(false);
      })
      .catch(error => {
        setIsSaveAnswerSubmiting(false);
      });
  }

  function handleDeleteAnswer() {
    setIsDeleteAnswerSubmiting(true);
    AnswerService.delete(answer.id)
      .then(res => {
        setIsDeleteAnswerSubmiting(false);
        if (onDelete) {
          onDelete(answer);
        }
      })
      .catch(error => {
        setIsDeleteAnswerSubmiting(false);
      });
  }

  return (
    <>
      <Row gutter={16}>
        <Col span={20}>
          <Input
            type="text"
            name="text"
            placeholder="Enter your answer here"
            defaultValue={answer?.text}
            onChange={onInputChange}
            onBlur={handleSaveAnswer}
          />
        </Col>
        <Col span={2} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Switch
            checked={Boolean(answer.isCorrectAnswer)}
            onChange={e => {
              onInputChange({
                target: {
                  name: "isCorrectAnswer",
                  value: e
                }
              });
            }}
          />
        </Col>
        <Col span={2}>
          <Button
            danger
            loading={isDeleteAnswerSubmiting}
            onClick={() => {
              handleDeleteAnswer(answer);
            }}
          >
            {"Delete"}
          </Button>
        </Col>
      </Row>
    </>
  );
}
