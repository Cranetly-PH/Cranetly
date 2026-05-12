import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi! I\'m the EconoConnect assistant. How can I help you today?', sender: 'bot' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('product') || lower.includes('post')) {
      return 'You can post products by clicking the "Post" button in the Marketplace, or using the post prompt on the Home page.';
    }
    if (lower.includes('order') || lower.includes('ship')) {
      return 'You can view your orders by clicking the shopping cart icon in the navigation bar.';
    }
    if (lower.includes('message') || lower.includes('chat')) {
      return 'You can message other users through the Messages page. Go to any product listing to start a conversation with the seller.';
    }
    if (lower.includes('inventory')) {
      return 'You can manage your inventory from the Inventory page. Add categories and products to track your stock.';
    }
    if (lower.includes('verify') || lower.includes('verification')) {
      return 'Complete your verification steps in Profile → Verify Account. Email, phone, and ID verification unlock full marketplace access.';
    }
    if (lower.includes('request') || lower.includes('supply')) {
      return 'Businesses can post supply requests from the Dashboard. Suppliers can then browse and submit offers.';
    }
    return "Thanks for your message! I can help you with product listings, orders, messages, inventory management, and account verification. What would you like to know?";
  }

  function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = { id: Date.now(), text: inputMessage, sender: 'user' };
    const query = inputMessage;
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        text: getBotResponse(query),
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    }, 800);
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 max-h-[500px]">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="text-sm">EconoConnect Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 rounded p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-500 dark:text-gray-400">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
