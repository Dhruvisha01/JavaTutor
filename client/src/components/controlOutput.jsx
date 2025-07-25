// This is the reveal answers panel in the control version of the tutor

// Importing the required dependencies
import React, { useState, useEffect, useRef } from "react";
import '../assets/css/tutor.css'
import BotMessage from "./botMessage";

// When on production get base url from the env file and on localhost use the localhost version
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Props - correct answers(array of correct answers), studentId (the student's id), moduleId (the current module), questionId(the current question)
const ControlOutput = ({ CorrectAnswers, studentId, moduleId, questionId, feedbackMessage }) => {
    const [revealed, setRevealed] = useState(false);

    // To scroll to the bottom
    const chatEndRef = useRef(null);

    // Control or test
    const studentGroup = sessionStorage.getItem("studentGroup");

    useEffect(() => {
        if (revealed || feedbackMessage) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [revealed, feedbackMessage]); // Auto-scroll on feedback update


    // Clicking the reveal answer button
    const handleClick = async () => {
        setRevealed(true);

        // Storing in the student's collection
        try {
            const response = await fetch(`${BASE_URL}/api/reveal-answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ studentId, moduleId, questionId }),
            });

            const data = await response.json();
            console.log("Reveal answer recorded:", data);

            const sessionId = localStorage.getItem("sessionId");
            const timestamp = new Date().toISOString();

            // Storing in the userInteractions collection
            await fetch(`${BASE_URL}/api/log-interaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    studentId,
                    moduleId,
                    questionId,
                    eventType: "reveal-answer",
                    timestamp,
                    studentGroup
                }),
            });
        } catch (error) {
            console.error("Error sending reveal answer data:", error);
        }
    }
    return (
        <div className="bot">
            <p className="inter-bold bot-title">Feedback</p>
            <div className="bot-content">
                <div className="chat-area">
                    <BotMessage message={"Welcome to the Java Tutor! Try entering the answers to the right and once done press the run button to run the code and verify your answers. If at any moment, you feel stuck, just press the reveal answers button below to get the answers"} />
                    <button className="inter-bold reveal" onClick={handleClick}>Reveal Answers</button>

                    {/* Display feedback message dynamically */}
                    {revealed && (
                        <BotMessage
                            message={`Correct Answers: ${Array.isArray(CorrectAnswers)
                                ? CorrectAnswers.join(", ")
                                : CorrectAnswers || "No answers available"
                                }`}
                        />

                    )}
                    {/* ✅ Show correct answer message when the answer is right */}
                    {feedbackMessage && <BotMessage message={feedbackMessage} />}
                    <div ref={chatEndRef} />
                </div>
            </div>

        </div>
    )
};

export default ControlOutput