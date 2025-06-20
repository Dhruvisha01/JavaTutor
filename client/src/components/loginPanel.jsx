import React, { useState } from 'react'
import '../assets/css/login.css'
import users from '../assets/images/users.svg'
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
console.log("Base url is -", BASE_URL)

const LoginPanel = () => {
    const sessionId = localStorage.getItem("sessionId");
    console.log("Session id is on Login Pane; -", sessionId)
    const [rollNumber, setRollNumber] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleBegin = async () => {
        if (!rollNumber.trim()) {
            setError('Please enter a Unique ID');
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNumber }),
            });

            const data = await response.json();
            console.log("Data from login - ", data)
            if (response.ok) {
                sessionStorage.setItem('studentId', data.user._id);
                sessionStorage.setItem('studentGroup', data.user.type);
                console.log("Data from login type - ", data.user.type)
                if (data.user.type == "test") {
                    navigate(`/home?studentId=${data.user._id}`);
                }
                else if (data.user.type == "control") {
                    navigate(`/dashboard?studentId=${data.user._id}`);
                }

            } else {
                setError(data.message || 'Invalid Unique ID');
            }
        } catch (error) {
            setError('Server error. Please try again later.');
            console.error('Login error:', error);
        }
    };

    return (
        <div className='loginPanel'>
            <img className="userImage" src={users} alt="" />
            <h3>Login</h3>
            <label htmlFor="rollNumber">Unique ID</label>
            <input
                type="text"
                name="rollNumber"
                id="rollNumber"
                className="rollNumber"
                value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                placeholder='John2805' />
            {error && <p className="error">{error}</p>}
            <button className='submit' onClick={handleBegin}>Begin</button>
        </div>
    )
}

export default LoginPanel
