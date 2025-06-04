'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, FileText, User, Bot, Loader2 } from 'lucide-react';
import * as React from 'react';

interface Doc {
  pageContent?: string;
  content?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message,
          documents: data?.docs,
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const extractFileName = (source?: string) => {
    if (!source) return 'Unknown Document';
    const parts = source.split(/[\\/]/);
    return parts[parts.length - 1] || 'Unknown Document';
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            PDF Chat Assistant
          </h1>
          <p className="text-slate-600 mt-1">Ask questions about your documents</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 inline-block">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to PDF Chat</h3>
                  <p className="text-slate-500">Start by asking a question about your documents</p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div className={`max-w-3xl ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <Card className={`${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <CardContent className="p-4">
                      <div className={`prose prose-sm max-w-none ${
                        msg.role === 'user' ? 'prose-invert' : 'prose-slate'
                      }`}>
                        {msg.content}
                      </div>
                      
                      {/* Document Sources */}
                      {msg.documents && msg.documents.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Sources ({msg.documents.length})
                            </span>
                          </div>
                          <div className="grid gap-3">
                            {msg.documents.map((doc, docIndex) => (
                              <Card key={docIndex} className="bg-slate-50 border-slate-200">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                                        {extractFileName(doc.metadata?.source)}
                                      </span>
                                      {doc.metadata?.loc?.pageNumber && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200">
                                          Page {doc.metadata.loc.pageNumber}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {(doc.pageContent || doc.content) && (
                                    <div className="text-sm text-slate-600 leading-relaxed">
                                      <div className="line-clamp-4">
                                        {doc.pageContent || doc.content}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                className="resize-none border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSendChatMessage} 
              disabled={!message.trim() || isLoading}
              size="lg"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;