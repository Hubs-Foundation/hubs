/* eslint-disable no-debugger */
/* eslint-disable react/display-name */
/* eslint-disable @calm/react-intl/missing-formatted-message */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import registerTelemetry from "../../telemetry";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import LayoutHeader from "./components/layout/Header";
import QuizService from "../../utilities/apiServices/QuizService";
import { Breadcrumb, Layout, Menu, Col, Row, Button, Card, Spin } from "antd";
import GettingStarted from "./components/page/view-quiz/GettingStarted";
import Question from "./components/page/view-quiz/Question";
import Result from "./components/page/view-quiz/result";
import "./ViewQuizPage.scss";

const { Header, Content, Footer, Sider } = Layout;

registerTelemetry("/content", "Content Page");

const QUIZ_STEPS = {
  GETTING_STARTED: 1,
  QUESTIONS: 2,
  RESULT: 3
};

export function ViewQuizPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizStep, setQuizStep] = useState(QUIZ_STEPS.GETTING_STARTED);

  useEffect(() => {
    const quizId = new URL(location.href).searchParams.get("quizId");
    setIsLoading(true);
    QuizService.getOne(quizId)
      .then(res => {
        setQuiz(res.data);
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
        setIsError(true);
      });
  }, []);

  function handleStartQuiz(quizResult) {
    setQuizResult(quizResult);
    handleNextStep();
  }

  function handleNextStep() {
    setQuizStep(quizStep + 1);
  }

  function handleNextQuestion() {
    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex < quiz?.questions?.length) {
      setQuestionIndex(nextQuestionIndex);
    } else {
      handleNextStep();
    }
  }

  return (
    <Content
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
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
          {isError ? (
            <div>
              <Row style={{ width: "100%" }}>
                <Col span={24} style={{ fontSize: "2em", fontWeight: "bold", textAlign: "center" }}>
                  {"404"}
                </Col>
              </Row>
              <Row style={{ width: "100%", marginTop: "50px" }}>
                <Col span={24} style={{ fontSize: "2em", textAlign: "center", color: "gray" }}>
                  {"Wrong quiz"}
                </Col>
              </Row>
            </div>
          ) : (
            <>
              {quizStep == QUIZ_STEPS.GETTING_STARTED && <GettingStarted quiz={quiz} onStartQuiz={handleStartQuiz} />}
              {quizStep == QUIZ_STEPS.QUESTIONS && (
                <div
                  style={{
                    height: "100vh",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Question
                    index={questionIndex}
                    quizResultId={quizResult.id}
                    questionId={quiz?.questions[questionIndex]?.id}
                    onSubmitAnswer={handleNextQuestion}
                  />
                </div>
              )}
              {quizStep == QUIZ_STEPS.RESULT && <Result quizResultId={quizResult.id} />}
            </>
          )}
        </>
      )}
    </Content>
  );
}
