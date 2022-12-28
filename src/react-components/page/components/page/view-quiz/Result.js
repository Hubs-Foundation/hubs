/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined, CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Checkbox, Radio, Space, Card } from "antd";
import QuestionService from "../../../../../utilities/apiServices/QuestionService";
import QuizResultService from "../../../../../utilities/apiServices/QuizResultService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState();

  useEffect(
    () => {
      setIsLoading(true);
      QuizResultService.getResults(props.quizResultId)
        .then(res => {
          setResults(res.data);
          setIsLoading(false);
        })
        .catch(error => {
          setIsLoading(false);
        });
    },
    [props.quizResultId]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "80%",
        marginTop: "6vh"
      }}
    >
      {isLoading ? (
        <div
          style={{
            height: "100%",
            minHeight: "300px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />} />
        </div>
      ) : (
        <>
          <Row style={{ width: "100%" }}>
            <Col span={12} style={{ fontSize: "1em", fontWeight: "bold" }}>
              {"You have complete the quiz!"}
            </Col>
          </Row>
          <Row style={{ width: "100%", margin: "20px 0px" }}>
            <Col span={12} style={{ fontSize: "1em", fontWeight: "bold" }}>
              {"Correct answers: "} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {results?.questions?.filter(q => !q.answers.find(a => a.selected && !a.isCorrectAnswer)).length}
              {" / "}
              {results?.questions?.length}
            </Col>
          </Row>
          {results?.questions?.map((question, index) => {
            return (
              <Row key={question.id} style={{ marginBottom: "50px", position: "relative" }}>
                <Col span={24}>
                  <Card>
                    <Row style={{ width: "100%", marginBottom: "20px" }}>
                      <Col span={24} style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                        {index + 1} {". "} {question?.text}
                      </Col>
                    </Row>
                    {question?.answers.map(answer => {
                      return (
                        <Row key={answer.id} style={{ width: "100%", marginTop: "20px" }}>
                          <Col
                            span={1}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "1.6em"
                            }}
                          >
                            {answer.selected && answer.isCorrectAnswer ? (
                              <CheckCircleFilled style={{ color: "green" }} />
                            ) : (
                              <></>
                            )}
                            {answer.selected && !answer.isCorrectAnswer ? (
                              <CloseCircleFilled style={{ color: "red" }} />
                            ) : (
                              <></>
                            )}
                          </Col>
                          <Col span={23}>{answer?.text}</Col>
                        </Row>
                      );
                    })}
                  </Card>
                </Col>
              </Row>
            );
          })}
        </>
      )}
    </div>
  );
}
