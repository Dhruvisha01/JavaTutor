import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import '../assets/css/tutor.css'

import Header from '../components/header'
import Problem from '../components/problem'
import Bot from '../components/bot'
import Editor from '../components/editor'
import Output from '../components/output'
import { modules } from '../constant'
import logo from '../assets/images/Logo.svg'

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const Tutor = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { moduleId, questionId } = useParams();

    console.log("You got this in the parameters", moduleId, questionId);

    console.log("Modules data:", modules);
    console.log("Received moduleId:", moduleId, "questionId:", questionId);

    const queryParams = new URLSearchParams(location.search);
    let studentId = queryParams.get("studentId") || sessionStorage.getItem("studentId");


    useEffect(() => {
        if (!studentId) {
            navigate("/"); // ✅ Redirect to login if not logged in
        } else {
            sessionStorage.setItem("studentId", studentId); // ✅ Store in session
        }
    }, [navigate, studentId]);

    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false); // Track loading state
    const [botMessages, setBotMessages] = useState([
        { sender: "bot", text: "Hi! Welcome to the Java Course. Start coding on the right. Ask me if you get stuck at any point." },
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const module = modules.find(m => m.moduleId === Number(moduleId));
    console.log("Matched module:", module);

    const question = module ? module.questions.find(q => q.questionId === Number(questionId)) : null;
    console.log("Matched question:", question);


    useEffect(() => {
        if (!question) {
            console.error("Question not found");
            navigate("/home");
        }
    }, [question, navigate]);

    const [saving, setSaving] = useState(false);
    const storeConversationHistory = async () => {
        if (!studentId || !moduleId || !questionId) return;

        setSaving(true); // Show "Saving conversation..." message

        const timestamp = new Date().toISOString();
        const conversationData = {
            moduleId: String(moduleId),
            questionId: String(questionId),
            timestamp: timestamp,
            messages: botMessages,
        };

        const url = `${BASE_URL}/api/storeConversation`;
        const data = JSON.stringify({ studentId, conversationData });

        try {
            console.log("🚀 Saving conversation...");

            // First try `fetch()`
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: data,
            });

            console.log("✅ API Response:", response.status);

            if (!response.ok) {
                throw new Error(`API failed with status ${response.status}`);
            }

            // Save student progress
            await fetch(`${BASE_URL}/api/student-progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, moduleId, questionId, isChecked: true }),
            });

            console.log("✅ Progress saved successfully!");

        } catch (error) {
            console.error("❌ Error saving conversation or progress:", error);
        }

        setSaving(false);
    };


    useEffect(() => {
        const handleUnload = async (event) => {
            console.log("⚠️ Tab is attempting to close... Delaying closure by 5 seconds.");

            setSaving(true); // Show saving message in UI

            // Delay the tab close for 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));

            await storeConversationHistory(); // Save conversation

            console.log("✅ Conversation saved. Closing tab...");
            setSaving(false); // Hide message

            // Attempt to close the tab automatically (works only for self-opened tabs)
            window.open("about:blank", "_self").close();
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [botMessages]);




    const sanitizeCode = (code) => {
        return code
            .replace(/\u00A0/g, " ") // Replace non-breaking spaces with normal spaces
            .replace(/\t/g, "    ") // Replace tabs with spaces
            .trim(); // Remove leading and trailing whitespace
    };

    const runCode = async (code) => {
        console.log("Sending this code:", code);
        const sanitizedCode = sanitizeCode(code);
        const url = `${BASE_URL}/api/execute`;

        const requestBody = {
            clientId: "19f502d67b809bb3491c24a025bcef54", // Replace with your actual Client ID
            clientSecret: "20b8c7fc700ea1e56ee3076675ca8bda7192ebd799aa5101a620728c27d30dd6", // Replace with your actual Client Secret
            script: sanitizedCode, // The Java code you want to execute
            stdin: "",
            language: "java",
            versionIndex: "4", // Use the appropriate versionIndex for Java
            compileOnly: false, // Set this to true if you only want to compile the code
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Execution result:", data);
            return data; // Returns the response, which includes the output
        } catch (error) {
            console.error("Error executing code:", error);
            return { error: error.message };
        }
    };

    const handleRunCode = async (code, isCorrect) => {
        console.log("I pressed run - ", isCorrect)
        setLoading(true); // Start loading
        const result = await runCode(code); // Call the JDoodle API
        setLoading(false); // End loading

        if (result.error) {
            setOutput(`Error: ${result.error}`);

        } else {
            setOutput(result.output); // Display the output
            if (isCorrect) {
                setBotMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Congratulations, you got the right answer and can move on! Press Done to store your progress." },
                ]);
                try {
                    const response = await fetch(`${BASE_URL}/api/student-progress`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ studentId, moduleId, questionId, isChecked: true })
                    });
                    console.log("Called API to update progress", response);
                    if (!response.ok) {
                        throw new Error("Failed to update progress");
                    }

                    const refreshProgress = await fetch(`${BASE_URL}/api/student-progress/${studentId}`);
                    const newProgress = await refreshProgress.json();
                    console.log("Updated progress:", newProgress);
                } catch (error) {
                    console.error("Error updating progress:", error);
                }
            } else {
                setBotMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: "Your code has some issues. Let me help you debug step by step." },
                ]);
            }
        }
    };

    const sendMessage = async (message) => {
        // Append user message to chat
        setBotMessages((prevMessages) => [...prevMessages, { sender: "user", text: message }]);

        // Simulate bot typing
        setIsTyping(true);

        try {
            // Send conversation history to ChatGPT
            const response = await fetch(`${BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: botMessages.concat({ sender: "user", text: message }).map((msg) => ({
                        role: msg.sender === "user" ? "user" : "assistant",
                        content: msg.text,
                    })),
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Append ChatGPT response to chat
            setBotMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: data.response },
            ]);
        } catch (error) {
            setBotMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: "Error: Could not fetch a response. Please try again." },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!question) return null;


    const handleDoneClick = async () => {
        console.log("✅ Done button clicked, saving progress and conversation...");

        // Save conversation history
        await storeConversationHistory();

        // Notify student
        setBotMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: "✅ Progress saved! You can proceed to the next question by closing this tab." },
        ]);
    };

    return (
        <div className="tutor">
            <Header topic={question.headerTopic} problem={`Problem ${questionId}`} />
            {saving && <div className="saving-message">💾 Saving your conversation... Please wait.</div>}
            <div className="topPart">
                <Problem statement={question.problemStatement}
                    input={question.input}
                    output={question.output} />
                <Editor
                    onRunCode={handleRunCode}
                    setBotMessages={setBotMessages}
                    setIsTyping={setIsTyping}
                    initialCode={question.code}
                    problemStatement={question.problemStatement}
                    initialCorrectAnswers={question.correctAnswers}
                />
            </div>
            <div className="bottomPart">
                <Bot
                    messages={botMessages}
                    isTyping={isTyping}
                    onSendMessage={sendMessage}
                    onDone={handleDoneClick}
                />
                <Output output={output} loading={loading} />
            </div>
        </div>
    )
}

export default Tutor