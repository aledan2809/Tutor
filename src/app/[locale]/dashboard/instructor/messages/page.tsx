"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  channel: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
  recipient: { id: string; name: string | null; image: string | null };
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export default function InstructorMessagesPage() {
  const t = useTranslations("instructor");
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [channel, setChannel] = useState<"in_app" | "email" | "whatsapp" | "sms">("in_app");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/instructor/messages").then((r) => r.json()),
      fetch("/api/dashboard/instructor/students?limit=100").then((r) => r.json()),
    ]).then(([msgData, studentData]) => {
      setMessages(msgData.messages ?? []);
      setStudents(
        (studentData.students ?? []).map((s: { id: string; name: string | null; email: string | null; image: string | null }) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          image: s.image,
        }))
      );
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedStudent]);

  const filteredMessages = selectedStudent
    ? messages.filter(
        (m) => m.senderId === selectedStudent || m.recipientId === selectedStudent
      )
    : messages;

  const handleSend = async () => {
    if (!selectedStudent || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/instructor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: [selectedStudent],
          channel,
          subject: newSubject || undefined,
          content: newMessage,
        }),
      });
      if (res.ok) {
        setNewMessage("");
        setNewSubject("");
        // Refresh messages
        const data = await fetch(
          `/api/dashboard/instructor/messages?studentId=${selectedStudent}`
        ).then((r) => r.json());
        setMessages(data.messages ?? []);
      }
    } finally {
      setSending(false);
    }
  };

  // Get unique conversation partners
  const conversationPartners = Array.from(
    new Map(
      messages.flatMap((m) => [
        [m.sender.id, m.sender],
        [m.recipient.id, m.recipient],
      ])
    ).values()
  ).filter((p) => students.some((s) => s.id === p.id));

  if (loading) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("messages")}</h1>

      <div className="flex gap-4 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="">{t("allConversations")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationPartners.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">{t("noMessages")}</p>
            ) : (
              conversationPartners.map((partner) => {
                const lastMsg = messages.find(
                  (m) => m.senderId === partner.id || m.recipientId === partner.id
                );
                return (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedStudent(partner.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-800 transition-colors ${
                      selectedStudent === partner.id ? "bg-gray-800" : ""
                    }`}
                  >
                    {partner.image ? (
                      <Image
                        src={partner.image}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">
                        {(partner.name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {partner.name ?? "Unknown"}
                      </p>
                      {lastMsg && (
                        <p className="text-xs text-gray-500 truncate">
                          {lastMsg.content.slice(0, 40)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread + compose */}
        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-8">
                {t("noMessages")}
              </p>
            ) : (
              filteredMessages.map((msg) => {
                const isSent = students.every((s) => s.id !== msg.senderId);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isSent
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {msg.subject && (
                        <p className="text-xs font-semibold mb-1 opacity-80">
                          {msg.subject}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] opacity-60">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                        {msg.channel !== "in_app" && (
                          <span className="text-[10px] opacity-60 uppercase">
                            {msg.channel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose */}
          {selectedStudent && (
            <div className="border-t border-gray-800 p-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={t("messageSubject")}
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as typeof channel)}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="in_app">In-App</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("typeMessage")}
                  rows={2}
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? t("sending") : t("send")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
