"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
    image?: string; // Base64 image data
}

interface AIChatWidgetProps {
    formData: any;
    currentStep: number;
    onBeforeStepChange?: (callback: () => Promise<boolean>) => void;
}

export default function AIChatWidget({ formData, currentStep, onBeforeStepChange }: AIChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use ref to track previous step to avoid React closure issues
    const prevStepRef = useRef(currentStep);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Step change detection - check previous page and welcome new page
    useEffect(() => {
        console.log('[AIChatWidget] Step check:', { currentStep, prevStep: prevStepRef.current, isOpen });
        if (currentStep !== prevStepRef.current) {
            const oldStep = prevStepRef.current;
            const newStep = currentStep;
            prevStepRef.current = currentStep; // Update ref to new value

            console.log('[AIChatWidget] Step changed! Will check page', oldStep, 'and welcome page', newStep);

            // Only trigger if chat is open
            if (isOpen) {
                checkPageAndWelcome(oldStep, newStep);
            }
        }
    }, [currentStep, isOpen]);

    // Initial welcome when first opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            getWelcomeMessage();
        }
    }, [isOpen]);

    const checkPageAndWelcome = async (oldStep: number, newStep: number) => {
        setIsLoading(true);
        try {
            // First check the old page
            const checkRes = await fetch("/api/ai-assistant/check-page", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    step: oldStep,
                    formData: formData,
                }),
            });
            const checkData = await checkRes.json();
            // Always show check result for the page we're leaving
            if (checkData.response) {
                const hasIssues = !checkData.response.includes("✓");
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: hasIssues
                            ? `⚠️ **離開第 ${oldStep} 頁前的提醒：**\n\n${checkData.response}`
                            : `✅ **第 ${oldStep} 頁檢查完成！**`
                    },
                ]);
            }

            // Then get welcome for new page
            const welcomeRes = await fetch("/api/ai-assistant/welcome", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    step: newStep,
                    formData: formData,
                }),
            });
            const welcomeData = await welcomeRes.json();
            if (welcomeData.response) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: welcomeData.response },
                ]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getWelcomeMessage = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ai-assistant/welcome", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    step: currentStep,
                    formData: formData,
                }),
            });
            const data = await res.json();
            if (data.response) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.response },
                ]);
            }
        } catch (error) {
            console.error("Error getting welcome message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const sendMessage = async () => {
        if ((!inputValue.trim() && !selectedImage) || isLoading) return;

        const userMessage = inputValue.trim();
        const userImage = selectedImage;
        setInputValue("");
        setSelectedImage(null);

        setMessages((prev) => [...prev, {
            role: "user",
            content: userMessage || "(傳送圖片)",
            image: userImage || undefined
        }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai-assistant/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    message: userMessage,
                    step: currentStep,
                    formData: formData,
                    image: userImage,
                }),
            });
            const data = await res.json();
            if (data.response) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.response },
                ]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "抱歉，連線發生錯誤，請稍後再試。" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
            />

            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white z-50 hover:scale-105"
                    title="AI 助手"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 left-6 w-[420px] h-[550px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <span className="font-medium">AI 填表助手</span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                第 {currentStep} 頁
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 rounded p-1 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-gray-400 mt-8">
                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>我是您的 AI 填表助手</p>
                                <p className="text-sm">有任何問題都可以問我！</p>
                                <p className="text-xs mt-2">💡 可以傳送圖片詢問</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-md"
                                        : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                                        }`}
                                >
                                    {msg.image && (
                                        <img
                                            src={msg.image}
                                            alt="User upload"
                                            className="max-w-full rounded-lg mb-2 max-h-40 object-contain"
                                        />
                                    )}
                                    {msg.role === "assistant" ? (
                                        <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                            <div className="relative inline-block">
                                <img
                                    src={selectedImage}
                                    alt="Preview"
                                    className="h-16 rounded-lg object-contain"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                                title="傳送圖片"
                            >
                                <Image className="w-5 h-5" />
                            </button>
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="請輸入問題..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            按 Enter 發送 • 支援 Markdown 格式
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
