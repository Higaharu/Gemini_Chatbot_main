import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import Select from "react-select";
import askGemini from "./gemini";

const Question2 = ({ setQuestion, setAnswer, setResponder }) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedResponder, setSelectedResponderState] = useState(null);
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const navigate = useNavigate();
  const [showResponderSelection, setShowResponderSelection] = useState(true);
  const [showExplanationSelection, setShowExplanationSelection] =
    useState(false);
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);

  const responderOptions = [
    { value: "ロボット", label: "ロボット" },
    { value: "荘司さん", label: "荘司さん" },
    {
      value: "荘司さん（会話しながら回答）",
      label: "荘司さん（会話しながら回答）",
    },
  ];

  const explanationOptions = [
    { value: "おとな向け", label: "おとな向け" },
    { value: "こども向け", label: "こども向け" },
  ];

  const questionOptions = [
    { value: "0", label: "アップルバナナついて教えてください。" },
    { value: "1", label: "マルエスファームについて教えてください。" },
    {
      value: "2",
      label: "アップルバナナの美味しい食べ方について教えてください。",
    },
    { value: "3", label: "アップルバナナついて教えてください。" },
    { value: "4", label: "マルエスファームについて教えてください。" },
    { value: "5", label: "キッチンカーについて教えてください。" },
    { value: "6", label: "アップルバナナを育てる上でこだわりはありますか？" },
    { value: "7", label: "アップルバナナの美味しい食べ方を教えてください。" },
    {
      value: "8",
      label: "マルエスファームではアップルバナナ以外に何を栽培していますか？",
    },
    { value: "9", label: "台風の多い沖縄ではどのような備えをしますか？" },
    { value: "10", label: "自由記述" },
  ];

  const sendMessageToGemini = async (message) => {
    setIsWaiting(true);
    try {
      const answer = await askGemini(message); // askGemini を使用して回答を取得
      setAnswer(answer); // 回答を state に設定
      setQuestion(message); // 質問を state に設定
      setResponder(selectedResponder);
      navigate("/answer");
    } catch (error) {
      console.error("Gemini API 関連のエラー:", error); // エラーメッセージを修正
      setAnswer("Gemini API でエラーが発生しました。もう一度試してください。");
      setResponder(selectedResponder);
      navigate("/answer");
    } finally {
      setIsWaiting(false);
    }
  };

  const getReferenceFromAPI = async (message, group) => {
    setIsWaiting(true);
    try {
      const response = await axios.post("http://localhost:8000/api/gpt", {
        message: message,
        group: group,
      });

      const context = response.data.message; // context を取得
      const questionText =
        selectedQuestion === "10"
          ? inputValue
          : questionOptions.find((option) => option.value === selectedQuestion)
              ?.label || "";
      const promptMessage = `
      あなたは"${selectedResponder}"です。\n
      "${selectedExplanation}"に説明してください。\n
      データベースの情報を参照して、入力の答えを回答してください。\n
      回答は200文字程度にしてください。\n
      ##データベース\n
      "${context}"\n
      \n
      ##入力\n
      "${questionText}"
      `;

      sendMessageToGemini(promptMessage); // Gemini に送信
    } catch (error) {
      console.error("APIリクエストエラー: ", error);
      setAnswer("エラーが発生しました。もう一度試してください。");
      setResponder(selectedResponder);
      navigate("/answer");
      setIsWaiting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let group = 0;
    if (selectedResponder === "荘司さん") {
      group = 1;
    }
    const message =
      selectedQuestion === "10"
        ? inputValue
        : questionOptions.find((option) => option.value === selectedQuestion)
            ?.label || ""; // questionOptions から label を取得
    getReferenceFromAPI(message, group);
  };

  useEffect(() => {
    setShowExplanationSelection(selectedResponder !== null);
  }, [selectedResponder]);

  useEffect(() => {
    setShowQuestionSelection(selectedExplanation !== null);
  }, [selectedExplanation]);

  return (
    <div className="question-container">
      <div
        className={`icon ${
          selectedResponder === null
            ? "icon-default"
            : selectedResponder === "ロボット"
            ? "icon-robot"
            : "icon-shoji"
        }`}
      />
      <h1>質問</h1>
      <form onSubmit={handleSubmit} className="input-form">
        <div className="question-selection">
          <label htmlFor="responder-select">回答者を選んでください</label>
          <Select
            inputId="responder-select" // アクセシビリティのためにidを追加
            value={responderOptions.find(
              (option) => option.value === selectedResponder
            )}
            onChange={(e) => {
              setSelectedResponderState(e.value);
              setShowResponderSelection(false);
              setShowExplanationSelection(true);
            }}
            options={responderOptions}
            isSearchable={false}
            placeholder="選んでください"
          />
        </div>

        {showExplanationSelection && (
          <div className="explanation-selection">
            <label htmlFor="explanation-select">
              回答の説明の仕方を選べます
            </label>
            <Select
              inputId="explanation-select" // アクセシビリティのためにidを追加
              value={explanationOptions.find(
                (option) => option.value === selectedExplanation
              )}
              onChange={(e) => {
                setSelectedExplanation(e.value);
                setShowQuestionSelection(true); // 質問の選択を表示
              }}
              options={explanationOptions}
              isSearchable={false}
              placeholder="選んでください"
            />
          </div>
        )}

        {showQuestionSelection && (
          <div className="question-options">
            <label htmlFor="question-select">
              質問したいことを選んでください
            </label>
            <Select
              inputId="question-select" // アクセシビリティのためにidを追加
              value={questionOptions.find(
                (option) => option.value === selectedQuestion
              )}
              onChange={(e) => {
                setSelectedQuestion(e.value);
                setShowSubmitButton(true); // 質問を選択したら送信ボタンを表示
              }}
              options={questionOptions}
              isSearchable={false}
              placeholder="選んでください"
            />
          </div>
        )}

        {selectedQuestion === "10" && (
          <div className="input-section">
            <label htmlFor="free-input">質問したいことを入力してください</label>
            <input
              type="text"
              id="free-input" // アクセシビリティのためにidを追加
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSubmitButton(e.target.value !== ""); // 入力が空でない場合に送信ボタンを表示
              }}
              placeholder="入力してください。"
              disabled={isWaiting}
            />
          </div>
        )}

        {showSubmitButton && (
          <button
            className="question-sousin-button"
            type="submit"
            disabled={isWaiting}
          >
            {isWaiting ? "待機中..." : "質問する"}
          </button>
        )}
      </form>
    </div>
  );
};

export default Question2;
