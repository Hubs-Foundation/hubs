/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined, LeftOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input, Card } from "antd";
import Question from "./Question";
import QuizService from "../../../../../../utilities/apiServices/QuizService";
import QuestionService from "../../../../../../utilities/apiServices/QuestionService";
import async from "async";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const MAX_QUESTION = 10;
  const { quizId, onBack } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveQuizSubmiting, setIsSaveQuizSubmiting] = useState(false);
  const [isAddQuestionSubmiting, setIsAddQuestionSubmiting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const quiz = useRef({});

  useEffect(
    () => {
      load(quizId);
    },
    [quizId]
  );

  function load(quizId) {
    setIsLoading(true);
    async.parallel(
      [
        function(next) {
          QuizService.getOne(quizId)
            .then(res => {
              return next(null, res.data);
            })
            .catch(error => {
              return next(error);
            });
        },
        function(next) {
          QuestionService.getAll({
            filter: JSON.stringify([{ key: "quizId", operator: "=", value: quizId }])
          })
            .then(res => {
              return next(null, res.data.items);
            })
            .catch(error => {
              return next(error);
            });
        }
      ],
      function(error, [quizData, questionsData]) {
        quiz.current = quizData;
        console.log(questions);
        setQuestions(questionsData);
        setIsLoading(false);
      }
    );
  }

  function onInputChange(e) {
    const { value, name } = e.target;
    quiz.current[name] = value;
    console.log(quiz.current);
  }

  function handleSaveQuiz() {
    setIsSaveQuizSubmiting(true);
    QuizService.update(quizId, quiz.current)
      .then(res => {
        quiz.current = res.data;
        setIsSaveQuizSubmiting(false);
      })
      .catch(error => {
        setIsSaveQuizSubmiting(false);
      });
  }

  function handleAddQuestion() {
    setIsAddQuestionSubmiting(true);
    QuestionService.create({
      quizId: quizId
    })
      .then(res => {
        setQuestions([...questions, res.data]);
        setIsAddQuestionSubmiting(false);
      })
      .catch(error => {
        setIsAddQuestionSubmiting(false);
      });
  }

  function onDeleteQuestion(question) {
    setQuestions(questions.filter(q => q.id != question.id));
  }

  return (
    <Content style={{ margin: "0 16px" }}>
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
          <Row>
            <Col span={24} style={{ padding: "10px 0px" }}>
              <Button
                type="default"
                className="flex-center"
                style={{ float: "left" }}
                icon={<LeftOutlined />}
                onClick={onBack}
              >
                {t("content.QUIZ_TAB__QUIZ_DETAIL__BACK_BUTTON_LABEL")}
              </Button>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Card title={t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_DETAIL__QUIZ_DETAIL_LABEL")}>
                <Row>
                  <Col span={24}>
                    <label style={{ fontSize: "14px", margin: "10px 0px" }}>
                      {t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_DETAIL__QUIZ_TITLE_INPUT_LABEL")}
                    </label>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Input
                      type="text"
                      name="title"
                      placeholder={t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_TITLE_INPUT_PLACEHOLDER")}
                      defaultValue={quiz.current?.title}
                      onChange={onInputChange}
                      onBlur={handleSaveQuiz}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <label style={{ fontSize: "14px", margin: "10px 0px" }}>
                      {t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_INTRODUCTION_INPUT_LABEL")}
                    </label>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Input
                      type="text"
                      name="introduction"
                      placeholder={t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_INTRODUCTION_INPUT_PLACEHOLDER")}
                      defaultValue={quiz.current?.introduction}
                      onChange={onInputChange}
                      onBlur={handleSaveQuiz}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <label style={{ fontSize: "14px", margin: "10px 0px" }}>
                      {t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_DESCRIPTION_INPUT_LABEL")}
                    </label>
                  </Col>
                </Row>
                <Row>
                  <Col span={24}>
                    <Input
                      type="text"
                      name="description"
                      placeholder={t("content.QUIZ_TAB__QUIZ_DETAIL__QUIZ_DESCRIPTION_INPUT_PLACEHOLDER")}
                      defaultValue={quiz.current?.description}
                      onChange={onInputChange}
                      onBlur={handleSaveQuiz}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={24}>
              <>
                {questions?.map((question, i) => {
                  return (
                    <div key={question.id} style={{ margin: "30px 0px" }}>
                      <Question index={i + 1} question={question} onDelete={onDeleteQuestion} />
                    </div>
                  );
                })}
              </>
            </Col>
          </Row>
          {questions.length < MAX_QUESTION && (
            <Row style={{ marginTop: "30px", marginBottom: "50px" }}>
              <Col span={24}>
                <Button
                  className="flex-center"
                  style={{ width: "100%" }}
                  loading={isAddQuestionSubmiting}
                  onClick={handleAddQuestion}
                >
                  {"+ " + t("content.QUIZ_TAB__QUIZ_DETAIL__ADD_QUESTION_BUTTON_LABEL")}
                </Button>
              </Col>
            </Row>
          )}
        </>
      )}
    </Content>
  );
}
