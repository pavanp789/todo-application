
import axios from "axios";

const api = axios.create({
  baseURL: "https://todo-application-api-j4nk.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
