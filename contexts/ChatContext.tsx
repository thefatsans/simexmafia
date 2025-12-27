'use client'

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { isAdmin } from '@/data/admin'
import { getAIResponse } from '@/services/aiChatService'
import { getCurrentStaffName, getRandomStaffName } from '@/data/staff'

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'staff' | 'admin'
  senderName?: string // Name des Mitarbeiters
  timestamp: Date
  isTyping?: boolean
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatContextType {
  messages: ChatMessage[]
  isOpen: boolean
  isStaffMode: boolean
  currentStaffName: string
  toggleChat: () => void
  sendMessage: (text: string) => void
  toggleStaffMode: () => void
  clearChat: () => void // Neuen Chat starten
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const STORAGE_KEY = 'simexmafia-chat-messages'
const STORAGE_HISTORY_KEY = 'simexmafia-chat-history'
const STORAGE_STAFF_KEY = 'simexmafia-chat-staff-name'

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentStaffName, setCurrentStaffName] = useState<string>('Max')
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isStaffMode, setIsStaffMode] = useState(false)

  // Lade gespeicherte Nachrichten oder initialisiere
  const loadMessages = (): ChatMessage[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Konvertiere timestamp strings zurück zu Date Objekten
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
    
    return []
  }

  // Lade Staff-Name aus gespeicherten Nachrichten oder generiere neuen
  const loadStaffName = (): string => {
    if (typeof window === 'undefined') return 'Max'
    
    // Versuche zuerst aus localStorage zu laden
    const storedName = localStorage.getItem(STORAGE_STAFF_KEY)
    if (storedName) return storedName
    
    // Versuche aus gespeicherten Nachrichten zu extrahieren
    const loadedMessages = loadMessages()
    if (loadedMessages.length > 0) {
      const firstStaffMessage = loadedMessages.find(m => m.sender === 'staff' && m.senderName)
      if (firstStaffMessage?.senderName) {
        localStorage.setItem(STORAGE_STAFF_KEY, firstStaffMessage.senderName)
        return firstStaffMessage.senderName
      }
    }
    
    // Generiere neuen Namen
    const newName = getRandomStaffName()
    localStorage.setItem(STORAGE_STAFF_KEY, newName)
    return newName
  }

  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)

  // Lade Conversation History
  const loadConversationHistory = (): ConversationMessage[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading conversation history:', error)
    }
    
    return []
  }

  // Initialisiere beim Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Lade gespeicherte Nachrichten
      const loadedMessages = loadMessages()
      const loadedHistory = loadConversationHistory()
      
      // Lade oder generiere Staff-Name
      const staffName = loadStaffName()
      setCurrentStaffName(staffName)
      
      if (loadedHistory.length > 0) {
        setConversationHistory(loadedHistory)
      }
      
      // Wenn keine Nachrichten vorhanden, erstelle Begrüßung
      if (loadedMessages.length === 0) {
        const greetings = [
          `Hallo! 👋 Ich bin ${staffName} vom Support-Team. Wie kann ich dir helfen?`,
          `Hi! Ich bin ${staffName} und helfe dir gerne weiter. Was brauchst du?`,
          `Moin! ${staffName} hier vom Support. Womit kann ich dir helfen?`,
          `Hallo! ${staffName} vom SimexMafia Support. Wie kann ich dir heute helfen?`,
        ]
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
        
        const initialMessage: ChatMessage = {
          id: '1',
          text: randomGreeting,
          sender: 'staff',
          senderName: staffName,
          timestamp: new Date(),
        }
        
        setMessages([initialMessage])
        // Speichere sofort
        localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMessage]))
        localStorage.setItem(STORAGE_STAFF_KEY, staffName)
      } else {
        // Setze Nachrichten, falls vorhanden
        setMessages(loadedMessages)
      }
    }
  }, [])

  // Speichere Nachrichten bei jeder Änderung
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch (error) {
        console.error('Error saving chat messages:', error)
      }
    }
  }, [messages])

  // Speichere Conversation History bei jeder Änderung
  useEffect(() => {
    if (typeof window !== 'undefined' && conversationHistory.length > 0) {
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(conversationHistory))
      } catch (error) {
        console.error('Error saving conversation history:', error)
      }
    }
  }, [conversationHistory])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return

    // Wenn im Staff-Modus, sende als Mitarbeiter-Nachricht
    if (isStaffMode) {
      const staffMessage: ChatMessage = {
        id: Date.now().toString(),
        text: text.trim(),
        sender: 'staff',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, staffMessage])
      return
    }

    // Normale Benutzer-Nachricht
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Simuliere Typing-Indicator (wie ein echter Mitarbeiter tippt)
    const typingMessage: ChatMessage = {
      id: `typing-${Date.now()}`,
      text: '',
      sender: 'staff',
      senderName: currentStaffName,
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages(prev => [...prev, typingMessage])

    // Generiere KI-Antwort mit menschlicher Verzögerung (schneller aber immer noch natürlich)
    // Zuerst: Denken/Verarbeiten (1-2 Sekunden)
    const thinkingDelay = 1000 + Math.random() * 1000
    
    setTimeout(async () => {
      try {
        // Rufe KI-Service auf
        const aiResponse = await getAIResponse(text, conversationHistory, currentStaffName)
        
        // Entferne Typing-Indicator und erstelle leere Nachricht
        const responseId = `response-${Date.now()}`
        setMessages(prev => {
          const withoutTyping = prev.filter(m => !m.isTyping)
          const response: ChatMessage = {
            id: responseId,
            text: '',
            sender: 'staff',
            senderName: currentStaffName,
            timestamp: new Date(),
            isTyping: true,
          }
          return [...withoutTyping, response]
        })
        
        // Kurze Pause bevor das Tippen beginnt
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
        
        // Zeige Antwort Zeichen für Zeichen (schneller aber natürlich)
        let displayedText = ''
        
        // Tippe Zeichen für Zeichen mit variabler Geschwindigkeit (schneller)
        for (let i = 0; i < aiResponse.length; i++) {
          // Variable Verzögerung: 30-80ms pro Zeichen (schneller, aber immer noch menschlich)
          let charDelay = 30 + Math.random() * 50
          
          // Alle 15-25 Zeichen eine kleine Pause
          if (i > 0 && i % (15 + Math.floor(Math.random() * 10)) === 0) {
            charDelay += 150 + Math.random() * 200 // Extra Pause
          }
          
          // Bei Satzzeichen etwas länger pausieren
          if (aiResponse[i] === '.' || aiResponse[i] === '!' || aiResponse[i] === '?') {
            charDelay += 80 + Math.random() * 120
          }
          
          // Bei Kommas kürzere Pause
          if (aiResponse[i] === ',') {
            charDelay += 30 + Math.random() * 50
          }
          
          await new Promise(resolve => setTimeout(resolve, charDelay))
          displayedText += aiResponse[i]
          
          // Aktualisiere Nachricht
          setMessages(prev => {
            return prev.map(m => {
              if (m.id === responseId) {
                return { ...m, text: displayedText, isTyping: i < aiResponse.length - 1 }
              }
              return m
            })
          })
        }
        
        // Finale Nachricht ohne Typing-Indicator
        setMessages(prev => {
          return prev.map(m => {
            if (m.id === responseId) {
              return { ...m, text: aiResponse, isTyping: false }
            }
            return m
          })
        })
        
        // Aktualisiere Conversation History
        setConversationHistory(prev => {
          const updated: ConversationMessage[] = [
            ...prev,
            { role: 'user' as const, content: text },
            { role: 'assistant' as const, content: aiResponse },
          ]
          return updated
        })
      } catch (error) {
        console.error('Error generating AI response:', error)
        setMessages(prev => {
          const withoutTyping = prev.filter(m => !m.isTyping)
          const response: ChatMessage = {
            id: `response-${Date.now()}`,
            text: 'Entschuldigung, ich hatte gerade ein technisches Problem. Kannst du deine Frage nochmal stellen?',
            sender: 'staff',
            senderName: currentStaffName,
            timestamp: new Date(),
          }
          return [...withoutTyping, response]
        })
      }
    }, thinkingDelay)
  }, [conversationHistory, isStaffMode, currentStaffName])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const toggleStaffMode = useCallback(() => {
    if (typeof window === 'undefined') return
    const userEmail = localStorage.getItem('simexmafia-current-user')
    if (userEmail && isAdmin(userEmail)) {
      setIsStaffMode(prev => !prev)
      setMessages(prev => [...prev, {
        id: `staff-toggle-${Date.now()}`,
        text: isStaffMode 
          ? 'Mitarbeiter-Modus deaktiviert. Der Support übernimmt wieder.'
          : 'Mitarbeiter-Modus aktiviert. Du antwortest jetzt als Admin-Mitarbeiter.',
        sender: 'admin',
        senderName: 'Admin',
        timestamp: new Date(),
      }])
    }
  }, [isStaffMode])

  const clearChat = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // Lösche gespeicherte Daten
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_HISTORY_KEY)
    localStorage.removeItem(STORAGE_STAFF_KEY)
    sessionStorage.removeItem('simexmafia-current-staff')
    
    // Erstelle neuen Chat mit neuem Mitarbeiter (garantiert anderer Name)
    let newStaffName = getRandomStaffName()
    let attempts = 0
    // Stelle sicher, dass es ein anderer Name ist als der aktuelle
    while (newStaffName === currentStaffName && attempts < 10) {
      newStaffName = getRandomStaffName()
      attempts++
    }
    
    setCurrentStaffName(newStaffName)
    setConversationHistory([])
    
    const greetings = [
      `Hallo! 👋 Ich bin ${newStaffName} vom Support-Team. Wie kann ich dir helfen?`,
      `Hi! Ich bin ${newStaffName} und helfe dir gerne weiter. Was brauchst du?`,
      `Moin! ${newStaffName} hier vom Support. Womit kann ich dir helfen?`,
      `Hallo! ${newStaffName} vom SimexMafia Support. Wie kann ich dir heute helfen?`,
    ]
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: randomGreeting,
      sender: 'staff',
      senderName: newStaffName,
      timestamp: new Date(),
    }
    
    setMessages([newMessage])
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newMessage]))
    localStorage.setItem(STORAGE_STAFF_KEY, newStaffName)
  }, [currentStaffName])

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isStaffMode,
        currentStaffName,
        toggleChat,
        sendMessage,
        toggleStaffMode,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
