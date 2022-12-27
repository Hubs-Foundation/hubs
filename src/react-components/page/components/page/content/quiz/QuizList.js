/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { LoadingOutlined, EyeOutlined, DeleteOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Layout, Menu, Col, Row, Button, Spin, Empty, Card } from "antd";
import PopupCreateQuiz from "./PopupCreateQuiz";
import QuizService from "../../../../../../utilities/apiServices/QuizService";

const { Header, Content, Footer, Sider } = Layout;

export default function(props) {
  const { t } = useTranslation();
  const { onOpenQuizDetail } = props;
  const [isOpenPopupCreate, setIsOpenPopupCreate] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listQuiz, setListQuiz] = useState([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setIsLoading(true);
    QuizService.getAll({
      sort: "-createdAt"
    })
      .then(res => {
        const quizs = res.data.items;
        setListQuiz(quizs);
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  }

  function handleOpenPopupCreate() {
    console.log(isOpenPopupCreate);
    setIsOpenPopupCreate(true);
  }

  function handleDeleteQuiz(quizId) {
    setDeletingQuizId(quizId);
    QuizService.delete(quizId)
      .then(quiz => {
        setListQuiz(listQuiz.filter(q => q.id != quizId));
        setDeletingQuizId(null);
      })
      .catch(error => {
        setDeletingQuizId(null);
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
              <Button type="primary" style={{ float: "right" }} onClick={handleOpenPopupCreate}>
                {" + Add Quiz"}
              </Button>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              {listQuiz.length == 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: "100px" }} />
              ) : (
                <>
                  {listQuiz.map(quiz => {
                    return (
                      <Card key={quiz.id} style={{ marginBottom: "20px" }}>
                        <Row>
                          <Col span={18}>
                            <Row style={{ height: "30px" }}>
                              <Col span={24}>{quiz.title}</Col>
                            </Row>
                            <Row>
                              <Col span={24} style={{ fontSize: "0.9em", color: "#aaaaaa" }}>
                                {quiz.description || "Description"}
                              </Col>
                            </Row>
                          </Col>
                          <Col span={6} style={{ justifyContent: "right", alignItems: "center", display: "flex" }}>
                            <Button
                              type="default"
                              className="flex-center"
                              style={{ marginLeft: "10px" }}
                              icon={<EyeOutlined />}
                            >
                              {"Preview"}
                            </Button>
                            <Button
                              type="primary"
                              className="flex-center"
                              style={{ marginLeft: "10px" }}
                              icon={<UnorderedListOutlined />}
                              onClick={() => {
                                onOpenQuizDetail(quiz);
                              }}
                            >
                              {"Detail"}
                            </Button>
                            <Button
                              type="primary"
                              className="flex-center"
                              danger
                              style={{ marginLeft: "10px" }}
                              icon={<DeleteOutlined />}
                              loading={deletingQuizId == quiz.id}
                              onClick={() => {
                                handleDeleteQuiz(quiz.id);
                              }}
                            >
                              {"Delete"}
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </>
              )}
            </Col>
          </Row>
        </>
      )}
      {isOpenPopupCreate && (
        <PopupCreateQuiz
          setVisiable={setIsOpenPopupCreate}
          onComplete={() => {
            load();
          }}
        />
      )}
    </Content>
  );
}
