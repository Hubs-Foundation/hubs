/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined, DeleteOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input, Select, Switch, Card } from "antd";
import AnswerService from "../../../../../../utilities/apiServices/AnswerService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { onDelete, onChooseCorrectAnswer } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveAnswerSubmiting, setIsSaveAnswerSubmiting] = useState(false);
  const [isDeleteAnswerSubmiting, setIsDeleteAnswerSubmiting] = useState(false);
  const [answer, setAnswer] = useState(props.answer || {});

  useLayoutEffect(
    () => {
      setAnswer(props.answer);
    },
    [props.answer]
  );

  function onInputChange(e) {
    const { value, name } = e.target;
    setAnswer({
      ...answer,
      [name]: value
    });

    if (name == "isCorrectAnswer" && value && onChooseCorrectAnswer) {
      onChooseCorrectAnswer(answer);
    }
  }

  function handleSaveAnswer(answer) {
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
        <Col span={19}>
          <Input
            type="text"
            name="text"
            placeholder={t("content.QUIZ_TAB__ANSWER__TEXT_INPUT_PLACEHOLDER")}
            defaultValue={answer?.text}
            onChange={onInputChange}
            onBlur={() => {
              handleSaveAnswer(answer);
            }}
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
              handleSaveAnswer({
                ...answer,
                isCorrectAnswer: e
              });
            }}
          />
        </Col>
        <Col span={3}>
          <Button
            danger
            className="flex-center"
            loading={isDeleteAnswerSubmiting}
            icon={<DeleteOutlined />}
            style={{ float: "right" }}
            onClick={() => {
              handleDeleteAnswer(answer);
            }}
          >
            {t("content.QUIZ_TAB__ANSWER__DELETE_INPUT_LABEL")}
          </Button>
        </Col>
      </Row>
    </>
  );
}
