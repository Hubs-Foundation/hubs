/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input } from "antd";
import Question from "./Question";
import QuizService from "../../../../../utilities/apiServices/QuizService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { quizId, onBack } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const quiz = useRef({});

  useEffect(
    () => {
      load(quizId);
    },
    [quizId]
  );

  function load(quizId) {
    setIsLoading(true);
    QuizService.getOne(quizId)
      .then(res => {
        quiz.current = res.data;
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  }

  function onInputChange(e) {
    const { value, name } = e.target;
    quiz.current[name] = value;
    console.log(quiz.current);
  }

  function handleSaveQuiz() {
    setIsSaving(true);
    QuizService.update(quizId, quiz.current)
      .then(res => {
        quiz.current = res.data;
        setIsSaving(false);
      })
      .catch(error => {
        setIsSaving(false);
      });
  }

  return (
    <Content style={{ margin: "0 16px" }}>
      {isLoading ? (
        <div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />} />
        </div>
      ) : (
        <>
          <Row>
            <Col span={24} style={{ padding: "10px 0px" }}>
              <Button type="default" style={{ float: "left" }} onClick={onBack}>
                {"Back"}
              </Button>
              <Button type="primary" style={{ float: "right" }} onClick={handleSaveQuiz} loading={isSaving}>
                {"Save"}
              </Button>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={24}>
              <Row>
                <Col span={24}>
                  <label style={{ fontSize: "14px", margin: "10px 0px" }}>{"Title"}</label>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Input
                    type="text"
                    name="title"
                    placeholder="Enter quiz title"
                    defaultValue={quiz.current.title}
                    onChange={onInputChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <label style={{ fontSize: "14px", margin: "10px 0px" }}>{"Introduction"}</label>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Input
                    type="text"
                    name="introduction"
                    placeholder="Enter quiz introduction"
                    defaultValue={quiz.current.introduction}
                    onChange={onInputChange}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <label style={{ fontSize: "14px", margin: "10px 0px" }}>{"Description"}</label>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Input
                    type="text"
                    name="description"
                    placeholder="Enter quiz description"
                    defaultValue={quiz.current.description}
                    onChange={onInputChange}
                  />
                </Col>
              </Row>
              <div style={{ margin: "30px 0px" }}>
                <Question />
              </div>
              <Row style={{ marginTop: "30px" }}>
                <Col span={24}>
                  <Button style={{ width: "100%" }}>{"+ Add question"} </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}
    </Content>
  );
}
