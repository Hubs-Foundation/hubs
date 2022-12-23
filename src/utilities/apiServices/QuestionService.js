/* eslint-disable no-unused-vars */
import request from "./apiRequest";
import { API_ROOT } from "../constants";
import Store from "../store";

class QuestionService {
  static getAll(params) {
    return request.get("/v1/auth/questions", { params: params }).then(res => {
      return res.data;
    });
  }

  static getOne(id) {
    return request.get("/v1/auth/questions/" + id).then(res => {
      return res.data;
    });
  }

  static create(data) {
    return request.post("/v1/auth/questions", data).then(res => {
      return res.data;
    });
  }

  static update(id, data) {
    return request.put("/v1/auth/questions/" + id, data).then(res => {
      return res.data;
    });
  }
}

export default QuestionService;
