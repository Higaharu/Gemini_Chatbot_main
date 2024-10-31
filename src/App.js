import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Question from "./Question2";
import Answer from "./Answer";
import "./App.css";

const App = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [responder, setResponder] = useState("ロボット");

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              <Question
                setQuestion={setQuestion}
                setAnswer={setAnswer}
                setResponder={setResponder}
              />
            }
          />
          <Route
            path="/answer"
            element={
              <Answer
                question={question}
                answer={answer}
                responder={responder}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
