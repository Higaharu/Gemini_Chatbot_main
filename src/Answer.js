import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./App.css";
import askGemini from "./gemini";
import axios from "axios";

const Answer = ({ question, answer, responder }) => {
  const navigate = useNavigate();
  const [isSatisfied, setIsSatisfied] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [conversation, setConversation] = useState(() => {
    const storedConversation = localStorage.getItem("conversation");
    return storedConversation ? JSON.parse(storedConversation) : [];
  });
  const [currentAnswer, setCurrentAnswer] = useState(answer);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  useEffect(() => {
    if (question && answer && conversation.length === 0) {
      const updatedConversation = [
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ];
      setConversation(updatedConversation);
      localStorage.setItem("conversation", JSON.stringify(updatedConversation));
    }
  }, [question, answer, conversation]);

  useEffect(() => {
    if (isSatisfied === false) {
      const prompt =
        conversation.map((turn) => `${turn.role}: ${turn.content}`).join("\n") +
        "\nuser: 満足のいく回答ではありませんでした。他にどのような質問をすれば良いでしょうか？JSON形式で３つ提案してください。JSONのフォーマットは {'suggestions': [{'question': '質問1'}, {'question': '質問2'}, {'question': '質問3'}]} としてください。JSONのフォーマットの外には文字を出力しないでください。";

      askGemini(prompt).then((geminiResponse) => {
        console.log("Gemini からのレスポンス (生のデータ):", geminiResponse);

        try {
          // 正規表現を使ってJSON部分だけを抽出
          const jsonString = geminiResponse.match(/\{.*\}/s);

          if (jsonString) {
            // シングルクォートをダブルクォートに置換
            const fixedJsonString = jsonString[0].replace(/'/g, '"');
            const json = JSON.parse(fixedJsonString); // 修正後の文字列をパース
            setSuggestedQuestions(json.suggestions);
          } else {
            console.error(
              "有効な JSON 形式ではありませんでした。受信データ:",
              geminiResponse
            );
            setSuggestedQuestions([]);
          }
        } catch (error) {
          console.error(
            "JSON パースエラー:",
            error,
            "受信データ:",
            geminiResponse
          );
          setSuggestedQuestions([]);
        }
      });
    } else {
      setSuggestedQuestions([]);
    }
  }, [isSatisfied, conversation]);

  const handleSatisfaction = (satisfied) => {
    setIsSatisfied(satisfied);
  };

  const handleSuggestedQuestionClick = (suggestedQuestion) => {
    setFeedback(suggestedQuestion);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/api/gpt", {
        message: feedback,
        group: 0,
      });

      const context = response.data.message;

      const newQuestion = `
      データベースの情報を参照して、入力の答えを回答してください。\n
      回答は200文字以内にしてください。\n
      ##データベース\n
      "${context}"\n
      \n
      ##入力\n
      "${feedback}"
      `;

      const prompt =
        conversation.map((turn) => `${turn.role}: ${turn.content}`).join("\n") +
        `\nuser: ${newQuestion}`;

      const newAnswer = await askGemini(prompt);

      setCurrentAnswer(newAnswer);
      setFeedback("");
      setIsSatisfied(null);

      const updatedConversation = [
        ...conversation,
        { role: "user", content: newQuestion },
        { role: "assistant", content: newAnswer },
      ];
      setConversation(updatedConversation);
      localStorage.setItem("conversation", JSON.stringify(updatedConversation));
    } catch (error) {
      console.error("エラー:", error);
    }
  };

  const handleGoBack = () => {
    localStorage.removeItem("conversation");
    navigate("/");
  };

  return (
    <div className="answer-container">
      <div
        className={`icon ${
          responder === "ロボット" ? "icon-robot" : "icon-shoji"
        }`}
      />
      <h1>回答</h1>
      <div className="answer">
        <strong className="kaitou">回答: </strong>
        <div className="answer-text">{currentAnswer}</div>
      </div>

      {responder === "荘司さん（会話しながら回答）" && (
        <>
          {isSatisfied === null && (
            <div className="satisfaction-question">
              <label htmlFor="feedback-input">満足のいく回答ですか？</label>
              <button
                className="answer-yes-button"
                onClick={() => handleSatisfaction(true)}
              >
                はい
              </button>
              <button
                className={
                  isSatisfied === false
                    ? `answer-no-button-clicked`
                    : `answer-no-button`
                }
                onClick={() => handleSatisfaction(false)}
              >
                いいえ
              </button>
            </div>
          )}

          {isSatisfied === false && (
            <div>
              <label htmlFor="feedback-input">
                フィードバックを入力してください
              </label>
              <div className="answer-example-container">
                {suggestedQuestions.map((suggestion, index) => (
                  <button
                    className="answer-example-question"
                    key={index}
                    onClick={() =>
                      handleSuggestedQuestionClick(suggestion.question)
                    }
                  >
                    {suggestion.question}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmitFeedback} className="feedback-form">
                <div className="answer-feedback-input-area">
                  <textarea
                    className="answer-textarea"
                    id="feedback-input"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <button className="answer-sousin-button" type="submit">
                    送信
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      <button className="answer-goback-button" onClick={handleGoBack}>
        戻る
      </button>
    </div>
  );
};

export default Answer;
