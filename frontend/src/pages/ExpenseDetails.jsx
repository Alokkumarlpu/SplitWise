import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, MessageSquare, Send, User, Trash2, Calendar, ShieldAlert, Edit2 } from 'lucide-react';

const ExpenseDetails = () => {
  const { id } = useParams(); // Expense ID
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchExpense = async () => {
    try {
      const expenseRes = await api.get(`/api/expenses/${id}/`);
      setExpense(expenseRes.data);
      
      // Fetch historical chat logs
      const msgRes = await api.get(`/api/expenses/${id}/messages/`);
      setMessages(msgRes.data);
    } catch (err) {
      console.error("Error loading expense details", err);
      // Navigate to dashboard if unauthorized or not found
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [id]);

  // WebSocket Connection Management
  useEffect(() => {
    if (loading || !expense) return;

    // Resolve WS protocol and host dynamically
    const isHttps = API_BASE_URL.startsWith('https');
    const wsScheme = isHttps ? 'wss' : 'ws';
    // Remove protocol prefix to get host (e.g. '127.0.0.1:8000' or 'splitwise-backend.render.com')
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${wsScheme}://${host}/ws/chat/expense/${id}/`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => {
        // Prevent duplicate append if message was fetched or sent locally
        if (prev.some(msg => msg.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    socket.onerror = (err) => {
      console.error("WebSocket connection error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      if (socket) socket.close();
    };
  }, [loading, expense, id]);

  // Autoscroll chat window to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current) return;

    const payload = {
      message: inputMessage,
      user_id: currentUser.id,
    };

    // Send payload through WebSocket connection
    wsRef.current.send(JSON.stringify(payload));
    setInputMessage('');
  };

  const handleDeleteExpense = async () => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${id}/`);
      navigate(`/groups/${expense.group}`);
    } catch (err) {
      console.error("Error deleting expense", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left column: Expense Details */}
        <div className="flex-1 space-y-6">
          
          {/* Back link */}
          <Link to={`/groups/${expense.group}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Group</span>
          </Link>

          {/* Expense card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{expense.description}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-gray-300" />
                  <span>{new Date(expense.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteExpense}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 rounded-xl transition cursor-pointer"
                  title="Delete expense"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Total value panel */}
            <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-5 mb-8 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Amount</span>
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">₹{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Paid by</span>
                <span className="text-md font-bold text-gray-800">{expense.payer.username}</span>
              </div>
            </div>

            {/* Splits lists */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Split Shares</h2>
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                {expense.splits.map((split) => {
                  const isPayer = split.user.id === expense.payer.id;
                  const isCurrentUser = split.user.id === currentUser.id;

                  return (
                    <div key={split.id} className="p-4 flex justify-between items-center bg-gray-50/20">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          {split.user.username} {isCurrentUser && <span className="text-xs text-emerald-600 font-medium">(You)</span>}
                        </span>
                        
                        {/* Display split detail (e.g. shares count or percent value) if Unequal/Percent/Shares splits were used */}
                        {split.split_type !== 'equal' && split.split_value && (
                          <span className="text-xs text-gray-400 block mt-0.5 capitalize">
                            Split {split.split_type}: {parseFloat(split.split_value).toFixed(split.split_type === 'shares' ? 0 : 2)}
                            {split.split_type === 'percentage' ? '%' : split.split_type === 'shares' ? ' share(s)' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-gray-800">
                          ₹{parseFloat(split.amount).toFixed(2)}
                        </span>
                        {isPayer && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">Paid share</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: WebSocket Chat discussions */}
        <div className="w-full lg:w-[450px] shrink-0 flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm h-[600px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Expense Discussion</h2>
          </div>

          {/* Messages Feed body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-xs font-semibold">No discussions yet.</p>
                <p className="text-[10px] max-w-xs mt-1">Ask questions, explain splits details, or log updates here.</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.user.id === currentUser.id;

                return (
                  <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* User profile bubble header */}
                    {!isMe && (
                      <span className="text-[10px] text-gray-400 font-semibold mb-0.5 ml-1.5">{msg.user.username}</span>
                    )}

                    {/* Chat Text Bubble */}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="break-all">{msg.message}</p>
                    </div>

                    {/* Sent time */}
                    <span className="text-[8px] text-gray-400 mt-0.5 mx-1.5">
                      {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>

                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input field */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              required
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition"
              placeholder="Write a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md hover:shadow-emerald-600/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>

      </main>
    </div>
  );
};

export default ExpenseDetails;
