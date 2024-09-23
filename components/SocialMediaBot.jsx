import React, { useState, useRef, useEffect } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import axios from "axios";
import Sidebar from "./Sidebar";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { CSVLink } from "react-csv";
import { AzureOpenAI } from "openai";

const SocialMedia = () => {
  const [messCont, setMessCont] = useState([
    { user: "bot", message: "Hello! How can I help you?", sql_answer: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [formattedJsonData, setFormattedJsonData] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(false);
  const csvLink = useRef();
  const firstUpdate = useRef(true);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messCont]);

  useEffect(() => {
    const dots = document.querySelectorAll(".sm-dot");
    dots.forEach((dot, index) => {
      dot.style.animationDelay = `${0.5 * index}s`;
    });
  }, []);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    if (formattedJsonData !== "") {
      csvLink.current?.link?.click();
      setFormattedJsonData("");
    }
  }, [formattedJsonData]);

  const formatTextWithBoldAndTable = (text) => {
    const isTable = text.includes("|");

    if (isTable && !/^\s*-/.test(text)) {
      const rows = text?.split("\n");

      return (
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table
            style={{
              borderCollapse: "collapse",
              tableLayout: "fixed",
              width: "max-content",
              minWidth: "100%",
            }}
          >
            <tbody>
              {rows
                .filter((row) => !/^[-| ]+$/.test(row))
                .map((row, rowIndex) => {
                  const columns = row
                    .split("|")
                    .filter((col, i, arr) => i !== 0 && i !== arr.length - 1);

                  return (
                    <tr key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: "1px solid black",
                            padding: "8px",
                            width: "150px",
                            textAlign: "left",
                          }}
                        >
                          {col.trim()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      );
    } else {
      const parts = text.split(/(\*\*.*?\*\*)/);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        } else if (/^\s*-/.test(part)) {
          return <span key={i}>{"\u00A0\u00A0\u00A0\u00A0" + part}</span>;
        }
        return part;
      });
    }
  };

  const formatTextWithBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      } else if (/^\s*-/.test(part)) {
        return <span key={i}>{"\u00A0\u00A0\u00A0\u00A0" + part}</span>;
      }
      return part;
    });
  };

  const handleSubmit = async () => {
    if (userInput.trim() === "") {
      alert("Type a question!");
      return;
    }

    setMessCont((prevState) => [
      ...prevState,
      { user: "user", message: userInput, sql_answer: "" },
    ]);

    setUserInput("");
    setLoading(true);
    const body = {
      query: {
        question: userInput,
      },
      user_agent: {
        username: " ",
      },
    };
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_SOCIAL_MEDIA_INSIGHTS_URL,
        body,
        headers
      );

      const keyPoints = response.data.answer.split("\n");
      const parsedSqlResponse = response.data.sql_answer;

      setMessCont((prevState) => [
        ...prevState,
        { user: "bot", message: keyPoints, sql_answer: parsedSqlResponse },
      ]);
    } catch (error) {
      // Handle errors
      setMessCont((prevState) => [
        ...prevState,
        { user: "bot", message: ["Error! Please try again"] },
      ]);
      alert(error.response?.data?.detail || "An error occurred");
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  const endpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.NEXT_PUBLIC_API_VERSION;
  const deployment = process.env.NEXT_PUBLIC_DEPLOYMENT;

  const handleOpenAI = async (data) => {
    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment,
      dangerouslyAllowBrowser: true,
    });

    const result = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant, I will give you data which you need to convert into a valid json. Here is how a valid json looks like: [{'key-1': 'value-1','key-2': 'value-2'},{'key-1': 'value-1','key-2': 'value-2'}]. Remove all the unicode characters.",
        },

        { role: "user", content: data },
      ],
      //past_messages: 10,
      max_tokens: 4096,
      temperature: 0.05,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    let answer = "";

    for (const choice of result.choices) {
      answer = choice.message.content;
    }
    return answer;
  };

  const handleDownload = async (data) => {
    setDownloadProgress(true);
    const response = await handleOpenAI(data);
    const formattedResponse = JSON.parse(response);
    setFormattedJsonData(formattedResponse);
    setDownloadProgress(false);
  };

  return (
    <div className="flex flex-row flex-grow w-full">
      <div className="">
        <Sidebar />
      </div>
      <div className="flex flex-col" style={{ width: "calc(100% - 16rem)" }}>
        <div className="flex flex-row items-center gap-5 justify-start  my-4 ml-8">
          <div className="text-lg text-[#001E96] font-inter font-normal">
            Social Media Insights
          </div>
        </div>

        <div
          className="flex-1 p-4 bg-gray-100 min-h-[85vh] max-h-[85vh] mx-8 overflow-y-scroll scroll-m-4 scroll-bar rounded"
          ref={chatContainerRef}
        >
          {messCont.map((mess, index) => (
            <div key={index} className="flex items-center">
              {index === messCont.length - 1 &&
                mess.user === "user" &&
                loading && (
                  <div className="flex justify-start items-center mt-40">
                    <QuestionAnswerIcon className="text-blue-800 text-3xl mr-2" />
                    <div className="p-2 my-2 rounded-md bg-blue-50 w-40 flex flex-row gap-1.5">
                      Thinking
                      <div className="flex flex-row justify-center items-center pt-2">
                        <div className="sm-dot"></div>
                        <div className="sm-dot"></div>
                        <div className="sm-dot"></div>
                      </div>
                    </div>
                  </div>
                )}

              {mess.user === "bot" && (
                <div className="flex flex-col">
                  <div className="flex justify-start items-center overflow-x-auto scroll scroll-m-4 scroll-bar">
                    <QuestionAnswerIcon className="text-blue-800 text-3xl mr-2" />
                    <div
                      className={`p-2 my-2 rounded-md ${
                        mess.user === "bot"
                          ? "bg-blue-50 bg-opacity-95"
                          : "bg-gray-200"
                      }`}
                    >
                      {Array.isArray(mess.message)
                        ? mess.message.map((point, idx) => (
                            <div key={idx}>
                              {formatTextWithBoldAndTable(point)}
                            </div>
                          ))
                        : formatTextWithBold(mess.message)}
                    </div>
                  </div>
                  {mess.sql_answer !== 0 && mess.sql_answer !== "" && (
                    <div className="flex justify-end mr-2 cursor-pointer">
                      {!downloadProgress && (
                        <CloudDownloadIcon
                          fontSize="small"
                          onClick={() => handleDownload(mess.sql_answer)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {mess.user === "user" && (
                <div className="flex justify-end items-center ml-auto">
                  <div
                    className={`p-2 my-2 ml-auto rounded-md ${
                      mess.user === "bot" ? "bg-blue-50" : "bg-gray-200"
                    }`}
                  >
                    {mess.message}
                  </div>
                  <AccountCircleRoundedIcon className="text-gray-600 text-3xl ml-2" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div className="flex items-center border-t border-gray-300 p-2 bg-white mx-8">
          <input
            className="flex-1 p-2 border border-gray-300 rounded-md"
            placeholder="Type your question here..."
            onChange={(e) => setUserInput(e.target.value)}
            value={userInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {loading ? (
            <PlayArrowIcon className="text-gray-400 text-3xl ml-2" />
          ) : (
            <PlayArrowIcon
              className="text-blue-800 text-3xl ml-2 cursor-pointer"
              onClick={() => !loading && handleSubmit()}
            />
          )}
        </div>
      </div>
      <CSVLink
        data={formattedJsonData}
        filename="exportedChat.csv"
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </div>
  );
};

export default SocialMedia;
