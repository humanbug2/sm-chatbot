import React, { useState, useRef, useEffect } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import axios from "axios";
import Sidebar from "./Sidebar";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { CSVLink } from "react-csv";
import { AzureOpenAI } from "openai";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";

const SocialMedia = () => {
  const [messCont, setMessCont] = useState([
    {
      user: "bot",
      message: "Hello! How can I help you?",
      sql_answer: "",
      question: "",
    },
  ]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  const socialMediaUrl = process.env.NEXT_PUBLIC_SOCIAL_MEDIA_INSIGHTS_URL;

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
    if (formattedJsonData !== "") {
      csvLink.current?.link?.click();
      setFormattedJsonData("");
    }
  }, [formattedJsonData]);

  const parseTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        const cleanPart = part.replaceAll(")", "").replaceAll("(", "");
        return (
          <a
            key={index}
            href={cleanPart}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "blue" }}
          >
            Link
          </a>
        );
      } else if (part.includes("[Link](")) {
        const cleanedText = part.replace("[Link](", " ");
        return cleanedText;
      } else {
        return part;
      }
    });
  };

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
              width: "200px",
            }}
          >
            <tbody>
              {rows
                .filter((row) => !/^[-| ]+$/.test(row))
                .map((row, rowIndex) => {
                  const columns = row
                    .split(/[\|\n]/)
                    .filter((col, i, arr) => i !== 0 && i !== arr.length - 1);

                  return (
                    <tr key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: "1px solid black",
                            padding: "8px",
                            width: "200px",
                            textAlign: "left",
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {typeof col === "string"
                            ? parseTextWithLinks(col)
                            : col.trim()}
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
      const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/);
      return parts
        .filter((part) => part !== "!")
        .map((part, i) => {
          if (part.startsWith("### ")) {
            return (
              <span key={i} className="text-xl">
                {part.slice(4)}
              </span>
            );
          } else if (part.startsWith("#### ")) {
            return (
              <span key={i} className="text-lg">
                {part.slice(5)}
              </span>
            );
          } else if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          } else if (/^\s*-/.test(part)) {
            return <span key={i}>{"\u00A0\u00A0\u00A0\u00A0" + part}</span>;
          } else if (/\[.*?\]\(.*?\)/.test(part)) {
            const linkText = part.match(/\[(.*?)\]/)?.[1]; // Get the text inside square brackets
            const url = part.match(/\((.*?)\)/)?.[1]; // Get the URL inside round brackets

            if (url.includes("https://procdna-auxo-datalake")) {
              return (
                <img key={i} src={url} alt={linkText || "Image"} className="" />
              );
            } else
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  {linkText}
                </a>
              );
          } else if (part.includes("https://")) {
            // Split the part by spaces to isolate potential URLs
            const subParts = part.split(/\s+/);

            return subParts.map((subPart, j) => {
              if (subPart.startsWith("https://")) {
                return (
                  <a
                    key={`${i}-${j}`}
                    href={subPart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    {subPart}
                  </a>
                );
              }
              // Return other text normally
              return subPart + " ";
            });
          }
          return part;
        });
    }
  };
  const detectUrlOrNumber = (mess) => {
    // Check if the message is a valid URL
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

    if (urlRegex.test(mess)) {
      return true;
    } else return false;
  };

  const formatTextWithBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith("### ")) {
        return (
          <span key={i} className="text-xl">
            {part.slice(4)}
          </span>
        );
      } else if (part.startsWith("#### ")) {
        return (
          <span key={i} className="text-lg">
            {part.slice(5)}
          </span>
        );
      } else if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      } else if (/^\s*-/.test(part)) {
        return <span key={i}>{"\u00A0\u00A0\u00A0\u00A0" + part}</span>;
      }
      return part;
    });
  };

  const handleSubmit = async (questionText) => {
    const userMessage = questionText || userInput.trim(); // Use clicked question or input box text
    if (userMessage === "") {
      toast.info("Please type a question first");
      return;
    }
  
    setMessCont((prevState) => [
      ...prevState,
      { user: "user", message: userMessage, sql_answer: "", question: userMessage },
    ]);
  
    setUserInput("");
    setLoading(true);
    const body = {
      question: userMessage,
    };
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
    };
  
    try {
      const response = await axios.post(socialMediaUrl + "chat/", body, headers);
      console.log(response, "response");
  
      const keyPoints = response.data.response.split("\n");
      const parsedSqlResponse = response.data.data_for_graph;
      const question = response.data.question;
      const suggestedQues = response.data.suggested_questions || []; // Extract suggested questions
  
      setMessCont((prevState) => [
        ...prevState,
        {
          user: "bot",
          message: keyPoints,
          question: question,
          ...(parsedSqlResponse && { sql_answer: parsedSqlResponse }),
        },
      ]);
  
      setSuggestedQuestions(suggestedQues); // Update suggested questions
    } catch (error) {
      setMessCont((prevState) => [
        ...prevState,
        { user: "bot", message: ["Error! Please try again"] },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleClearChat = async () => {
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(
        socialMediaUrl + "clear_chat/",
        headers
      );
      window.location.reload();
      console.log(response, "response");
    } catch (error) {
      // Handle errors
      toast.error("Unable to clear the chat history");
      console.log("error", error);
    } finally {
      // Reset loading state
    }
  };

  const endpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.NEXT_PUBLIC_API_VERSION;
  const deployment = process.env.NEXT_PUBLIC_DEPLOYMENT;

  const handleOpenAI = async (data, question) => {
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
            "You are an AI assistant. I will provide you with a question and some data, which you need to convert into a valid JSON format. Include headers based on the data content. The JSON should look like: {{'header1': 'value1', 'header2': 'value2'}, ...}. Remove any Unicode characters if they appear.",
        },
        { role: "user", content: `Question: ${question}` },
        { role: "user", content: `Data: ${data}` },
      ],
      max_tokens: 4096,
      temperature: 0,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    let answer = "";
    for (const choice of result.choices) {
      answer = choice.message.content;
    }
    console.log("answer", answer);
    return answer;
  };

  const handleDownload = async (data, question) => {
    if (data === undefined) {
      toast.info("Data not available");
      return;
    }
    setDownloadProgress(true);
    try {
      const response = await handleOpenAI(data, question);
      const formattedResponse = JSON.parse(response);

      setFormattedJsonData(formattedResponse);
    } catch (error) {
      toast.error(
        "Unable to generate excel for the requested message. Please try again later."
      );
      console.log("Error occurred", error);
    }
    setDownloadProgress(false);
  };

  return (
    <div className="flex flex-row flex-grow w-full">
      <div className="">
        <Sidebar />
      </div>
      <div className="flex flex-col" style={{ width: "calc(100% - 16rem)" }}>
        <div className="flex flex-row items-center gap-5 justify-between  my-4 ml-8">
          <div className="text-lg text-[#001E96] font-inter font-normal">
            Social Media Insights
          </div>
          <button
            className="mr-8 bg-[#008CE3] rounded-sm px-2 py-1 text-white"
            onClick={() => handleClearChat()}
          >
            Clear Conversation
          </button>
        </div>

        <div
  className="flex-1 p-4 bg-gray-100 min-h-[83vh] max-h-[83vh] xl:min-h-[85vh] xl:max-h-[85vh] mx-8 overflow-y-scroll scroll-m-4 scroll-bar rounded"
  ref={chatContainerRef}
>
  {messCont.map((mess, index) => (
    <div key={index} className="flex flex-col">
      <div className="flex items-center">
        {/* Display bot message */}
        {mess.user === "bot" && (
          <div className="flex flex-col">
            <div className="flex justify-start items-center">
              <QuestionAnswerIcon className="text-blue-800 text-3xl mr-2" />
              <div className="p-2 my-2 rounded-md bg-blue-50 bg-opacity-95">
                {Array.isArray(mess.message)
                  ? mess.message.map((point, idx) => (
                      <div key={idx}>{formatTextWithBoldAndTable(point)}</div>
                    ))
                  : formatTextWithBold(mess.message)}
              </div>
            </div>

            {/* Suggested Questions (Only after the latest bot message) */}
            {index === messCont.length - 1 && suggestedQuestions.length > 0 && (
              <div className="p-3 mt-2 rounded shadow-md">
                <h3 className="text-gray-600 font-semibold mb-2">Suggested Questions:</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      className="px-4 py-2 bg-blue-200 text-gray-700 rounded hover:bg-blue-200 transition"
                      onClick={() => handleSubmit(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display user message */}
        {mess.user === "user" && (
          <div className="flex justify-end items-center ml-auto">
            <div className="p-2 my-2 rounded-md bg-gray-200">{mess.message}</div>
            <AccountCircleRoundedIcon className="text-gray-600 text-3xl ml-2" />
          </div>
        )}
      </div>
    </div>
  ))}
   {loading && (
    <div className="flex justify-start items-center">
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
        target="_self"
      />
   
    </div>
  );
};

export default SocialMedia;
