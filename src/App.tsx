import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Send, 
  User, 
  Bot, 
  MoreHorizontal, 
  Trash2, 
  Plus, 
  Layout, 
  MessageSquare,
  Award,
  ChevronRight,
  Settings,
  X,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

// --- Constants & Types ---

const SYSTEM_INSTRUCTION = `You are Sharda Kumari, a PMP-certified Project Delivery Lead with over 7 years of experience in delivering SaaS and enterprise software solutions. 

Professional Background:
- Currently a Project Delivery Lead, leading 4+ concurrent enterprise projects and cross-functional teams of 10+ members.
- Previously served as a Project Manager & Sr. Business Analyst, where you led the development of a Work Management SaaS product.
- Former Project Coordinator, managing web and mobile development projects.
- Started your career as a Business Analyst and Business Relationship Manager.
- IMPORTANT: Do not mention specific company names (like Netsmartz, Rudra, Tech Prastish, Cogniter, or Safety Circle) in your introduction or general professional summary.

Core Expertise:
- Project Planning & Control, PMO Governance, and Risk/Issue/Dependency Management.
- Budgeting, Resource Optimization, and KPI Dashboards (Power BI).
- Portfolio Management, Prioritization, and Cross-functional Leadership.
- Expert in Agile delivery, sprint planning, and stakeholder alignment.

Tools & Technology:
- Proficient in Jira, Azure DevOps, ClickUp, Monday.com, Asana, Trello, Miro, and Slack.
- AI-fluent: Experienced with Neno Bana, Google Gemini, Google AI studio, Claude Code, ChatGPT, Copilot, and perplexity ai.
- Tech-savvy: Knowledgeable in Python, JavaScript, and HTML, allowing you to bridge the gap between business needs and technical execution.

AI Projects & Initiatives:
- Monjur AI: Led and supported this initiative to build a legal AI assistant, improving workflow efficiency by 25–30% and earning high client appreciation for seamless delivery.
- QEvalPro: Played a key role in this platform, leveraging AI for customer management and data analysis, which improved data accuracy by 30%+ and enabled faster, insight-driven decision-making.
- Data Mapping POC: Drove a custom Proof of Concept focused on mapping records from unknown data sources, achieving 80%+ data matching accuracy and significantly reducing manual effort.
- Expert in bridging the gap between business needs and AI capabilities, with a strong focus on AI adoption and continuous innovation.

Education:
- Master in International Business Management from Chandigarh University.
- Bachelor’s Degree in Business Administration from APG Shimla University.

Tone and Style:
- Professional, organized, and results-driven (when applicable).
- Keep your answers very short and concise.
- Use project management terminology naturally (e.g., critical path, stakeholders, velocity, retrospectives).
- Provide strategic, action-oriented advice.
- Maintain a supportive and authoritative persona.
- Ensure correct grammar and spelling in all responses.

Always stay in character as Sharda Kumari and use your specific professional history to answer questions about your background, while adhering to the privacy constraints regarding company names.`;

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// --- Components ---

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm Sharda Kumari, how can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');

  // Initialize Gemini
  const chatRef = useRef<any>(null);

  const initChat = (key: string) => {
    const activeKey = key || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!activeKey) return;

    try {
      const genAI = new GoogleGenerativeAI(activeKey);
      chatRef.current = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction: SYSTEM_INSTRUCTION,
      }).startChat();
    } catch (err) {
      console.error("Failed to initialize Gemini:", err);
    }
  };

  useEffect(() => {
    initChat(apiKey);
  }, [apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Lazy initialization inside the handler matching user requested pattern
      if (!chatRef.current) {
        const activeKey = apiKey || (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!activeKey) {
          throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY or use Settings.");
        }
        
        const genAI = new GoogleGenerativeAI(activeKey);
        chatRef.current = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          systemInstruction: SYSTEM_INSTRUCTION,
        }).startChat();
      }

      const result = await chatRef.current.sendMessage(input);
      const response = await result.response;
      const text = response.text();
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Chat Error Detail:", error);
      
      let displayError = "I encountered a technical blocker while processing your request.";
      
      // Extract more detail if available (e.g., 400, 403, 404)
      if (error.message) {
        displayError = `Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: displayError,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: "Hello! I'm Sharda Kumari, how can I assist you today?",
        timestamp: new Date(),
      }
    ]);
    setInput('');
    initChat(apiKey);
  };

  const saveApiKey = (newKey: string) => {
    localStorage.setItem('gemini_api_key', newKey);
    setApiKey(newKey);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F5F7]">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="hidden md:flex flex-col glass border-r border-gray-200 z-20 overflow-hidden"
      >
        <div className="p-6 flex flex-col h-full">
          <nav className="flex-1 space-y-2">
            <SidebarItem 
              icon={<MessageSquare size={18} />} 
              label="Chat" 
              active 
              onClick={() => {}} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
            <SidebarItem 
              icon={<Trash2 size={18} />} 
              label="Clear Chat" 
              onClick={clearChat} 
            />
            <SidebarItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              onClick={() => setIsSettingsOpen(true)} 
            />
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider text-center pt-4">
              Sharda Kumari • PMP AI
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 glass flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:block hidden"
            >
              <Layout size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <MessageSquare size={16} />
              </div>
              <span className="font-semibold text-sm">Sharda Kumari</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Award size={12} />
              PMP Certified
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              title="New Chat"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex w-full gap-4",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-white apple-shadow flex items-center justify-center text-blue-600 flex-shrink-0 mt-1">
                      <Bot size={18} />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed apple-shadow",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <div className={cn(
                      "text-[10px] mt-2 opacity-50 font-medium",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 mt-1">
                      <User size={18} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-white apple-shadow flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Bot size={18} />
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-gray-100 apple-shadow flex items-center gap-1">
                  <motion.span 
                    animate={{ opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full" 
                  />
                  <motion.span 
                    animate={{ opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full" 
                  />
                  <motion.span 
                    animate={{ opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full" 
                  />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <div className="glass rounded-2xl apple-shadow p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-300">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Sharda about your project..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 min-h-[44px]"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-3 rounded-xl transition-all duration-300 flex items-center justify-center",
                  input.trim() && !isLoading 
                    ? "bg-blue-600 text-white hover:bg-blue-700 scale-100" 
                    : "bg-gray-100 text-gray-400 scale-95 cursor-not-allowed"
                )}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-3 font-medium uppercase tracking-wider">
              Sharda Kumari • Expert Project Management AI
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass rounded-3xl apple-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Settings size={20} />
                    </div>
                    <h2 className="text-xl font-semibold">Settings</h2>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Key size={16} />
                      </div>
                      <input
                        type="password"
                        defaultValue={apiKey}
                        placeholder="Enter your API key..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        onBlur={(e) => saveApiKey(e.target.value)}
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-gray-500 leading-relaxed px-1">
                      Your API key is stored locally in your browser. It is used to authenticate requests to the Gemini API.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-2xl hover:bg-blue-700 transition-colors apple-shadow"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white apple-shadow" 
        : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
    )}>
      <span className={cn(
        "transition-transform duration-200",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto"
        >
          <ChevronRight size={14} />
        </motion.div>
      )}
    </button>
  );
}
