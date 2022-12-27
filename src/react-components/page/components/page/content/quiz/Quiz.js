/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty } from "antd";
import QuizList from "./QuizList";
import QuizDetail from "./QuizDetail";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const [isVisiableQuizDetail, setIsVisiableQuizDetail] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const handleOpenQuizDetail = function(quiz) {
    setQuiz(quiz);
    setIsVisiableQuizDetail(true);
    console.log("Open Quiz: ", quiz);
  };

  const handleBackToQuizList = function() {
    setIsVisiableQuizDetail(false);
    setQuiz(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {!isVisiableQuizDetail && <QuizList onOpenQuizDetail={handleOpenQuizDetail} />}
      {isVisiableQuizDetail && (
        <div style={{ position: "absolute", top: 0, background: "white", width: "100%" }}>
          <QuizDetail quizId={quiz.id} onBack={handleBackToQuizList} />
        </div>
      )}
    </div>
  );
}
