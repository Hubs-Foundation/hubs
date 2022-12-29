/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined, DeleteOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Input, Select, Switch, Card } from "antd";
import QuestionService from "../../../../../../utilities/apiServices/QuestionService";
import AnswerService from "../../../../../../utilities/apiServices/AnswerService";
import Answer from "./Answer";
import async from "async";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { index, onDelete } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAnswerSubmiting, setIsAddAnswerSubmiting] = useState(false);
  const [isDeleteQuestionSubmiting, setIsDeleteQuestionSubmiting] = useState(false);
  const [isDeleteAnswerSubmiting, setIsDeleteAnswerSubmiting] = useState(false);
  const [isSaveQuestionSubmiting, setIsSaveQuestionSubmiting] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [question, setQuestion] = useState(props.question);

  useEffect(
    () => {
      load();
    },
    [props.question]
  );

  function load() {
    setIsLoading(true);
    QuestionService.getOne(question.id)
      .then(res => {
        setQuestion(res.data);
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  }

  function onInputChange(e) {
    const { value, name } = e.target;
    setQuestion({
      ...question,
      [name]: value
    });
  }

  function handleSaveQuestion(question) {
    setIsSaveQuestionSubmiting(true);
    QuestionService.update(question.id, {
      text: question.text,
      multiple: question.multiple
    })
      .then(res => {
        setQuestion({
          ...question,
          ...res.data
        });

        // if only one answer and has more one selected answer -> no select any answer
        if (!res.data.multiple && question.answers.filter(a => a.isCorrectAnswer).length > 1) {
          handleChooseAnswer(null);
        }

        setIsSaveQuestionSubmiting(false);
      })
      .catch(error => {
        setIsSaveQuestionSubmiting(false);
      });
  }

  function handleDeleteQuestion() {
    setIsDeleteQuestionSubmiting(true);
    QuestionService.delete(question.id)
      .then(res => {
        setIsDeleteQuestionSubmiting(false);
        if (onDelete) {
          onDelete(question);
        }
      })
      .catch(error => {
        setIsDeleteQuestionSubmiting(false);
      });
  }

  function handleAddAnswer() {
    setIsAddAnswerSubmiting(true);
    AnswerService.create({
      questionId: question.id
    })
      .then(res => {
        setQuestion({
          ...question,
          answers: [...(question.answers || []), res.data]
        });
        setIsAddAnswerSubmiting(false);
      })
      .catch(error => {
        setIsAddAnswerSubmiting(false);
      });
  }

  function onDeleteAnswer(answer) {
    setIsDeleteAnswerSubmiting(true);
    setQuestion({
      ...question,
      answers: question.answers.filter(a => a.id != answer.id)
    });
    setIsDeleteAnswerSubmiting(false);
  }

  function handleChooseAnswer(answer) {
    setIsLoading(true);

    // change answer then call api (for fast change)
    if (!question.multiple && question.answers.filter(a => a.isCorrectAnswer).length > 1) {
      setQuestion({
        ...question,
        answers: question.answers.map(a => {
          a.isCorrectAnswer = 0;
          return a;
        })
      });
    }

    QuestionService.chooseCorrectAnswer(question.id, answer?.id)
      .then(res => {
        setQuestion({
          ...question,
          answers: res.data
        });
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  }

  console.log("Question: ", question);

  return (
    <>
      <Row style={{ marginTop: "5px", position: "relative" }}>
        <Col span={24}>
          <Card
            title={t("content.QUIZ_TAB__QUESTION__NAME_LABEL") + " #" + index}
            extra={
              <>
                <Button
                  type="primary"
                  className="flex-center"
                  loading={isDeleteQuestionSubmiting}
                  style={{ float: "right", marginLeft: "20px" }}
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    handleDeleteQuestion(question.id);
                  }}
                >
                  {t("content.QUIZ_TAB__QUESTION__DELETE_BUTTON_LABEL")}
                </Button>
              </>
            }
          >
            <Row gutter={16}>
              <Col span={16}>
                <Input
                  type="text"
                  name="text"
                  placeholder={t("content.QUIZ_TAB__QUESTION__TEXT_INPUT_PLACEHOLDER")}
                  defaultValue={question?.text}
                  onChange={onInputChange}
                  onBlur={() => {
                    handleSaveQuestion(question);
                  }}
                />
              </Col>
              <Col span={8}>
                <Select
                  defaultValue={question.multiple}
                  style={{ width: "100%" }}
                  name={"multiple"}
                  onChange={value => {
                    handleSaveQuestion({
                      ...question,
                      multiple: value
                    });
                  }}
                  options={[
                    {
                      value: 0,
                      label: t("content.QUIZ_TAB__QUESTION__MULTIPLE_SELECT__OPTION_ONE_LABEL")
                    },
                    {
                      value: 1,
                      label: t("content.QUIZ_TAB__QUESTION__MULTIPLE_SELECT__OPTION_MULTIPLE_LABEL")
                    }
                  ]}
                />
              </Col>
            </Row>
            {question?.answers?.length > 0 && (
              <>
                <Row gutter={16} style={{ marginTop: "50px", marginBottom: "20px" }}>
                  <Col span={19}>
                    <span> {t("content.QUIZ_TAB__QUESTION__ANSWERS_LABEL")} </span>
                  </Col>
                  <Col span={2} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <span> {t("content.QUIZ_TAB__QUESTION__IS_CORRECT_LABEL")} </span>
                  </Col>
                </Row>
                {question?.answers?.map((answer, i) => {
                  return (
                    <div key={i} style={{ margin: "20px 0px" }}>
                      <Answer
                        question={question}
                        answer={answer}
                        onDelete={onDeleteAnswer}
                        onChooseCorrectAnswer={handleChooseAnswer}
                      />
                    </div>
                  );
                })}
              </>
            )}
            <Row gutter={16} style={{ marginTop: "50px", marginBottom: "20px" }}>
              <Col span={24} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Button onClick={handleAddAnswer} loading={isAddAnswerSubmiting}>
                  {"+ " + t("content.QUIZ_TAB__QUESTION__ADD_ANSWER_BUTTON_LABEL")}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
        {isLoading && (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              top: "0px",
              backgroundColor: "rgba(255,255,255, 0.7)"
            }}
          >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        )}
      </Row>
    </>
  );
}
