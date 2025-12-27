'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, User, UserCheck, RotateCcw } from 'lucide-react'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'

export default function ChatWidget() {
  const { messages, isOpen, isStaffMode, currentStaffName, toggleChat, sendMessage, toggleStaffMode, clearChat } = useChat()
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  const isUserAdmin = user?.email ? isAdmin(user.email) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-[9998] flex items-center justify-center group"
          aria-label="Chat öffnen"
          suppressHydrationWarning
        >
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          {mounted && messages.length > 1 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {messages.filter(m => m.sender === 'user').length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-fortnite-dark dark:bg-fortnite-dark light:bg-white border border-purple-500/30 dark:border-purple-500/30 light:border-gray-200 rounded-lg shadow-2xl flex flex-col z-[9999] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{currentStaffName}</h3>
                <p className="text-white/80 text-xs">
                  {isStaffMode ? 'Admin-Mitarbeiter' : 'Support-Mitarbeiter'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Neuen Chat starten"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              {isUserAdmin && (
                <button
                  onClick={toggleStaffMode}
                  className={`p-2 rounded-lg transition-colors ${
                    isStaffMode
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={isStaffMode ? 'Mitarbeiter-Modus deaktivieren' : 'Als Mitarbeiter zuschalten'}
                >
                  <UserCheck className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={toggleChat}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Chat schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-fortnite-darker dark:bg-fortnite-darker light:bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender !== 'user' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'admin'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}>
                    {message.sender === 'admin' ? (
                      <UserCheck className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-purple-500 text-white'
                      : message.sender === 'admin'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 dark:text-yellow-300 light:text-yellow-700'
                      : 'bg-blue-500/20 border border-blue-500/30 text-blue-300 dark:text-blue-300 light:text-blue-700'
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      {message.senderName && message.sender !== 'user' && (
                        <span className="text-xs opacity-60 mt-1 block">— {message.senderName}</span>
                      )}
                    </>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-purple-500/20 dark:border-purple-500/20 light:border-gray-200 bg-fortnite-dark dark:bg-fortnite-dark light:bg-white">
            {isStaffMode && (
              <div className="mb-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300 dark:text-blue-300 light:text-blue-700">
                  👤 Mitarbeiter-Modus aktiv: Deine Nachrichten werden als Mitarbeiter-Antworten gesendet. Derrek antwortet nicht automatisch.
                </p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isStaffMode ? "Antwort als Mitarbeiter eingeben..." : "Schreibe eine Nachricht..."}
                className="flex-1 bg-fortnite-darker dark:bg-fortnite-darker light:bg-gray-100 border border-purple-500/30 dark:border-purple-500/30 light:border-gray-300 rounded-lg px-4 py-2 text-white dark:text-white light:text-gray-800 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 light:focus:border-purple-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                aria-label="Nachricht senden"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

