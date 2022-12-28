/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Checkbox, Radio, Space } from "antd";
import QuestionService from "../../../../../utilities/apiServices/QuestionService";
import QuizResultService from "../../../../../utilities/apiServices/QuizResultService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSumiting, setIsSumiting] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState([]);

  useEffect(
    () => {
      setIsLoading(true);
      setSelectedAnswerIds([]);
      QuestionService.getOne(props.questionId)
        .then(res => {
          setQuestion(res.data);
          setIsLoading(false);
        })
        .catch(error => {
          setIsLoading(false);
        });
    },
    [props.questionId]
  );

  function handleChangeRadio(e) {
    const { name, value } = e.target;
    setSelectedAnswerIds([value]);
  }

  function handleChangeSelect(e) {
    const { name, checked } = e.target;
    if (checked) {
      setSelectedAnswerIds([...(selectedAnswerIds || []), name]);
    } else {
      setSelectedAnswerIds(selectedAnswerIds.current.filter(id => id != name));
    }
  }

  function handleSubmitAnswer() {
    setIsSumiting(true);
    QuizResultService.submitAnswers(props.quizResultId, {
      quizId: question?.quizId,
      questionId: question?.id,
      answerIds: JSON.stringify(selectedAnswerIds)
    })
      .then(res => {
        setIsSumiting(false);
        if (props.onSubmitAnswer) {
          props.onSubmitAnswer(question?.id, selectedAnswerIds);
        }
      })
      .catch(error => {
        setIsSumiting(false);
      });
  }

  return (
    <div>
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
          <Row style={{ width: "100%", marginBottom: "50px" }}>
            <Col span={24} style={{ fontSize: "2em", fontWeight: "bold" }}>
              {props.index + 1} {". "} {question?.text}
            </Col>
          </Row>
          {question?.multiple ? (
            <>
              <Space direction="vertical">
                {question?.answers?.map(answer => {
                  return (
                    <Row key={answer.id} style={{ width: "100%", marginTop: "20px", fontWeight: "normal" }}>
                      <Col span={24}>
                        <Checkbox name={answer.id} onChange={handleChangeSelect} style={{ fontWeight: "normal" }}>
                          {answer?.text}
                        </Checkbox>
                      </Col>
                    </Row>
                  );
                })}
              </Space>
            </>
          ) : (
            <Radio.Group
              onChange={e => {
                handleChangeRadio(e);
              }}
            >
              <Space direction="vertical">
                {question?.answers?.map(answer => {
                  return (
                    <Radio key={answer.id} value={answer.id} style={{ marginTop: "20px", fontWeight: "normal" }}>
                      {answer.text}
                    </Radio>
                  );
                })}
              </Space>
            </Radio.Group>
          )}
          <Row style={{ width: "100%", marginTop: "10vh" }}>
            <Col span={24} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Button
                type="primary"
                disabled={!(selectedAnswerIds?.length > 0)}
                loading={isSumiting}
                onClick={handleSubmitAnswer}
              >
                {"Submit answer"}
              </Button>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
