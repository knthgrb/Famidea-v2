"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import DefaultAvatar from "@/components/common/DefaultAvatar";

interface Message {
  id: number;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  appointment_id?: string;
  patient_id: string;
  birth_center_id: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  unread_count?: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializePatient = async () => {
      const patientId = searchParams.get("patient");
      if (!patientId) return;

      // First check if patient is in existing conversations
      const existingPatient = conversations.find((p) => p.id === patientId);
      if (existingPatient) {
        setSelectedPatient(existingPatient);
        return;
      }

      // If not in conversations, fetch patient details directly
      const supabase = createClient();
      const { data: patient } = await supabase
        .from("patients")
        .select("id, first_name, last_name, profile_picture_url")
        .eq("id", patientId)
        .single();

      if (patient) {
        // Add unread_count: 0 since this is a new conversation
        const newPatient = { ...patient, unread_count: 0 };
        setSelectedPatient(newPatient);
        // Add to conversations list if not already there
        setConversations((prev) => {
          if (!prev.find((p) => p.id === patient.id)) {
            return [...prev, newPatient];
          }
          return prev;
        });
      }
    };

    initializePatient();
  }, [searchParams]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadMessages(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadConversations = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: birthCenter } = await supabase
      .from("birth_centers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!birthCenter) return;

    // Get unique patients who have messages with this birth center
    const { data: messages } = await supabase
      .from("messages")
      .select("patient_id, read_at, sender_id")
      .eq("birth_center_id", birthCenter.id);

    const uniquePatientIds = [
      ...new Set(messages?.map((m) => m.patient_id) || []),
    ];
    const patientIds = uniquePatientIds;

    // Count unread messages per patient - only count messages FROM patients
    const unreadCounts = messages?.reduce((acc, msg) => {
      if (!msg.read_at && msg.sender_id === msg.patient_id) {
        acc[msg.patient_id] = (acc[msg.patient_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, profile_picture_url")
      .in("id", patientIds);

    if (patients) {
      const patientsWithUnreadCount = patients.map((patient) => ({
        ...patient,
        unread_count: unreadCounts?.[patient.id] || 0,
      }));
      setConversations(patientsWithUnreadCount);
    }
  };

  const loadMessages = async (patientId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: birthCenter } = await supabase
      .from("birth_centers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!birthCenter) return;

    // First, mark all unread messages from this patient as read
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("birth_center_id", birthCenter.id)
      .eq("patient_id", patientId)
      .eq("sender_id", patientId)
      .is("read_at", null)
      .select();

    // Then load all messages for display
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("birth_center_id", birthCenter.id)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      // Refresh conversations to update unread counts
      loadConversations();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: birthCenter } = await supabase
      .from("birth_centers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!birthCenter) return;

    const { data: message } = await supabase
      .from("messages")
      .insert([
        {
          content: newMessage,
          sender_id: birthCenter.id,
          receiver_id: selectedPatient.id,
          birth_center_id: birthCenter.id,
          patient_id: selectedPatient.id,
        },
      ])
      .select()
      .single();

    if (message) {
      setMessages([...messages, message]);
      setNewMessage("");

      await supabase.from("notifications").insert({
        type: "message",
        title: "New Message",
        body: "You have received a new message from the birth center.",
        patient_id: selectedPatient.id,
        birth_center_id: birthCenter.id,
        appointment_id: null,
        receiver_id: selectedPatient.id,
        is_read: false,
      });
    }
  };

  function capitalizeFullName(firstName: string, lastName: string): string {
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${
      lastName.charAt(0).toUpperCase() + lastName.slice(1)
    }`;
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List - Hide on mobile when chat is selected */}
      <div
        className={`w-full md:w-1/3 border-r flex flex-col ${
          selectedPatient ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                selectedPatient?.id === patient.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                {patient.profile_picture_url ? (
                  <Image
                    src={patient.profile_picture_url}
                    alt={`${patient.first_name} ${patient.last_name}`}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <DefaultAvatar
                    name={`${patient.first_name} ${patient.last_name}`}
                  />
                )}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-medium truncate ${
                      patient.unread_count ? "text-red-600" : ""
                    }`}
                  >
                    {capitalizeFullName(patient.first_name, patient.last_name)}
                  </h3>
                  {(patient.unread_count ?? 0) > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {patient.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area - Show on mobile when chat is selected */}
      <div
        className={`${
          selectedPatient ? "flex" : "hidden md:flex"
        } flex-col flex-1`}
      >
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center">
              {/* Add back button for mobile */}
              <button
                onClick={() => setSelectedPatient(null)}
                className="md:hidden mr-2 text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="relative w-10 h-10 flex-shrink-0">
                {selectedPatient.profile_picture_url ? (
                  <Image
                    src={selectedPatient.profile_picture_url}
                    alt={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <DefaultAvatar
                    name={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                  />
                )}
              </div>
              <h2 className="ml-4 text-lg font-semibold">
                {capitalizeFullName(
                  selectedPatient.first_name,
                  selectedPatient.last_name
                )}
              </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === message.birth_center_id
                      ? "justify-end"
                      : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === message.birth_center_id
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2"
                />
                <button
                  onClick={sendMessage}
                  className="bg-teal-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center"
                >
                  <span className="text-xl">➤</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
