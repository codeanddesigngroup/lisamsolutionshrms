"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { makeLocalUploadFiles } from "@/lib/local-upload";
import {
  Archive,
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Download,
  Edit,
  FileText,
  Heart,
  Image as ImageIcon,
  Info,
  Laugh,
  Lock,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  Shield,
  Smile,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type MemberType = "admin" | "employee" | "client";

type ChatMember = {
  key: string;
  id: number | string;
  type: MemberType;
  name: string;
  role?: string;
  avatar?: string;
  status?: "online" | "away" | "offline";
};

type ChatAttachment = {
  id: string;
  name: string;
  url: string;
  type: "image" | "file";
  size_label?: string;
  mime_type?: string;
};

type ChatReaction = {
  key: "like" | "heart" | "laugh";
  count: number;
  user_keys: string[];
};

type ChatMessage = {
  id: string | number;
  conversation_id: string | number;
  sender_key: string;
  sender_name: string;
  body: string;
  attachments?: ChatAttachment[];
  status_by?: Record<string, "sending" | "sent" | "delivered" | "seen">;
  reactions?: ChatReaction[];
  reply_to_id?: string | number | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
};

type GroupSettings = {
  only_admins_can_send?: boolean;
  only_admins_can_edit_info?: boolean;
  allow_member_uploads?: boolean;
  disappearing_messages_days?: number;
};

type ChatConversation = {
  id: string | number;
  type: "direct" | "group";
  name: string;
  description?: string;
  avatar?: string;
  participant_keys: string[];
  participants: ChatMember[];
  admin_keys?: string[];
  created_by?: string;
  settings?: GroupSettings;
  last_message?: string;
  last_message_at?: string;
  unread_by?: string[];
  muted_by?: string[];
  archived_by?: string[];
  pinned_message_id?: string | number | null;
  created_at?: string;
};

type ConfirmationDialog = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

const roleLabel: Record<MemberType, string> = {
  admin: "Admin",
  employee: "Employee",
  client: "Client",
};

const reactionMeta = {
  like: { label: "Like", icon: Check },
  heart: { label: "Heart", icon: Heart },
  laugh: { label: "Laugh", icon: Laugh },
} as const;

const formatTime = (dateValue?: string) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const asList = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const memberKeyFor = (type: MemberType, id: number | string) => `${type}:${id}`;

const getCurrentUserKey = (role?: string, id?: number | string) => {
  const safeId = id || 1;
  if (role === "client") return memberKeyFor("client", safeId);
  if (role === "employee") return memberKeyFor("employee", safeId);
  return memberKeyFor("admin", safeId);
};

const getDirectConversationName = (conversation: ChatConversation, currentUserKey: string) =>
  conversation.participants.find((member) => member.key !== currentUserKey)?.name || conversation.name;

const getDirectAvatar = (conversation: ChatConversation, currentUserKey: string) =>
  conversation.participants.find((member) => member.key !== currentUserKey)?.avatar || conversation.avatar || "";

const getMessageStatus = (message: ChatMessage, currentUserKey: string) => message.status_by?.[currentUserKey] || "sent";

export default function ChatPage() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const settingsAvatarInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserKey = useMemo(() => getCurrentUserKey(user?.role, user?.id), [user?.id, user?.role]);
  const currentUserName = user?.name || "Current User";
  const isAdminRole = user?.role === "admin";
  const canCreateMessages = isAdminRole || hasPermission("messages.create");
  const canEditMessages = isAdminRole || hasPermission("messages.edit");
  const canDeleteOwnMessages = isAdminRole || hasPermission("messages.delete") || hasPermission("messages.manage");
  const hasGroupDeletePermission = isAdminRole || hasPermission("messages.delete");
  const canManageMessages = isAdminRole || hasPermission("messages.manage");
  const canCreateGroups = canCreateMessages;

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [directory, setDirectory] = useState<ChatMember[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");
  const [showSidebar, setShowSidebar] = useState(true);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState("");
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialog | null>(null);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations],
  );
  const canDeleteActiveGroup = Boolean(
    activeConversation?.type === "group" &&
    (isAdminRole || (hasGroupDeletePermission && activeConversation.created_by === currentUserKey)),
  );
  const canLeaveActiveGroup = Boolean(
    activeConversation?.type === "group" &&
    activeConversation.participant_keys.includes(currentUserKey) &&
    activeConversation.created_by !== currentUserKey,
  );

  const activeMessages = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    return messages
      .filter((message) => message.conversation_id === activeConversation?.id)
      .filter((message) => !query || `${message.body} ${message.attachments?.map((attachment) => attachment.name).join(" ")}`.toLowerCase().includes(query))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeConversation?.id, chatSearchQuery, messages]);

  const canManageActiveGroup = useMemo(() => {
    if (!activeConversation || activeConversation.type !== "group") return false;
    return canManageMessages;
  }, [activeConversation, canManageMessages]);

  const canEditActiveGroupInfo = useMemo(() => {
    if (!activeConversation || activeConversation.type !== "group") return false;
    return canEditMessages && activeConversation.participant_keys.includes(currentUserKey);
  }, [activeConversation, canEditMessages, currentUserKey]);

  const canSendInActiveConversation = useMemo(() => {
    if (!activeConversation) return false;
    if (!canCreateMessages) return false;
    if (activeConversation.archived_by?.includes(currentUserKey)) return false;
    if (activeConversation.type === "group" && activeConversation.settings?.only_admins_can_send && !canManageActiveGroup) return false;
    return activeConversation.participant_keys.includes(currentUserKey);
  }, [activeConversation, canCreateMessages, canManageActiveGroup, currentUserKey]);

  const canUploadInActiveConversation = useMemo(() => {
    if (!activeConversation) return false;
    if (activeConversation.type === "group" && activeConversation.settings?.allow_member_uploads === false && !canManageActiveGroup) return false;
    return canSendInActiveConversation;
  }, [activeConversation, canManageActiveGroup, canSendInActiveConversation]);

  const visibleConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations
      .filter((conversation) => conversation.participant_keys.includes(currentUserKey))
      .filter((conversation) => !conversation.archived_by?.includes(currentUserKey))
      .filter((conversation) => {
        const displayName = conversation.type === "direct" ? getDirectConversationName(conversation, currentUserKey) : conversation.name;
        if (query && !displayName.toLowerCase().includes(query)) return false;
        if (activeTab === "unread") return Boolean(conversation.unread_by?.includes(currentUserKey));
        if (activeTab === "groups") return conversation.type === "group";
        return true;
      })
      .sort((a, b) => String(b.last_message_at || b.created_at || "").localeCompare(String(a.last_message_at || a.created_at || "")));
  }, [activeTab, conversations, currentUserKey, searchQuery]);

  const activePinnedMessage = useMemo(
    () => activeMessages.find((message) => message.id === activeConversation?.pinned_message_id) || null,
    [activeConversation?.pinned_message_id, activeMessages],
  );

  useEffect(() => {
    const loadChat = async () => {
      setLoading(true);
      try {
        const [conversationRes, messageRes, employeeRes, adminRes] = await Promise.all([
          api.get("/chat-conversations"),
          api.get("/chat-messages"),
          api.get("/employees"),
          api.get("/admins"),
        ]);

        const employeeMembers = asList<Record<string, unknown>>(employeeRes.data).map((employee) => {
          const id = employee.id as number | string;
          const detail = employee.employee_detail as { designation?: { name?: string } } | undefined;
          const type: MemberType = employee.role === "admin" ? "admin" : "employee";
          return {
            key: memberKeyFor(type, id),
            id,
            type,
            name: String(employee.name || employee.email || `Employee ${id}`),
            role: detail?.designation?.name || roleLabel[type],
            avatar: String(employee.avatar || employee.image || ""),
            status: String(employee.status || "online") === "active" ? "online" : "offline",
          } as ChatMember;
        });

        const adminMembers = asList<Record<string, unknown>>(adminRes.data).map((admin) => ({
          key: memberKeyFor("admin", admin.id as number | string),
          id: admin.id as number | string,
          type: "admin" as const,
          name: String(admin.name || admin.email || `Admin ${admin.id}`),
          role: "Admin",
          avatar: String(admin.avatar || admin.image || ""),
          status: String(admin.status || "active") === "active" ? "online" as const : "offline" as const,
        }));

        const currentMember: ChatMember = {
          key: currentUserKey,
          id: user?.id || 1,
          type: user?.role === "client" ? "client" : user?.role === "employee" ? "employee" : "admin",
          name: currentUserName,
          role: roleLabel[user?.role === "client" ? "client" : user?.role === "employee" ? "employee" : "admin"],
          avatar: "",
          status: "online",
        };

        const members = [currentMember, ...adminMembers, ...employeeMembers].filter(
          (member, index, list) => list.findIndex((item) => item.key === member.key) === index,
        );

        const storedConversations = asList<ChatConversation>(conversationRes.data).filter(
          (conversation) =>
            !conversation.participant_keys.some((key) => key.startsWith("client:")) &&
            !conversation.participants.some((participant) => participant.type === "client"),
        );
        const directConversations = members
          .filter((member) => member.key !== currentUserKey)
          .filter((member) => !storedConversations.some((conversation) => conversation.type === "direct" && conversation.participant_keys.includes(currentUserKey) && conversation.participant_keys.includes(member.key)))
          .map((member) => ({
            id: `direct-${[currentUserKey, member.key].sort().join("-")}`,
            type: "direct" as const,
            name: member.name,
            participant_keys: [currentUserKey, member.key],
            participants: [currentMember, member],
            unread_by: [],
            muted_by: [],
            archived_by: [],
            created_by: currentUserKey,
            created_at: new Date().toISOString(),
          }));

        setDirectory(members);
        setConversations([...storedConversations, ...directConversations]);
        setMessages(asList<ChatMessage>(messageRes.data));
        await Promise.allSettled(directConversations.map((conversation) => api.post("/chat-conversations", { ...conversation, company_id: user?.company_id })));
      } catch (error) {
        console.error("Chat load error", error);
        showToast("Chat data could not be loaded.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [currentUserKey, currentUserName, showToast, user?.company_id, user?.id, user?.role]);

  useEffect(() => {
    if (!user?.company_id) return;

    const refreshChat = async () => {
      try {
        const [conversationRes, messageRes] = await Promise.all([api.get("/chat-conversations"), api.get("/chat-messages")]);
        setConversations(
          asList<ChatConversation>(conversationRes.data).filter(
            (conversation) =>
              !conversation.participant_keys.some((key) => key.startsWith("client:")) &&
              !conversation.participants.some((participant) => participant.type === "client"),
          ),
        );
        setMessages(asList<ChatMessage>(messageRes.data));
      } catch {
        // Keep the last successful chat state while connectivity recovers.
      }
    };

    const intervalId = window.setInterval(() => void refreshChat(), 3000);
    return () => window.clearInterval(intervalId);
  }, [user?.company_id]);

  useEffect(() => {
    if (!activeConversationId && visibleConversations[0]) {
      const timeoutId = window.setTimeout(() => {
        setActiveConversationId(visibleConversations[0].id);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [activeConversationId, visibleConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  const persistConversation = async (conversation: ChatConversation) => {
    setConversations((current) => current.map((item) => (item.id === conversation.id ? conversation : item)));
    try {
      await api.put(`/chat-conversations/${conversation.id}`, { ...conversation, company_id: user?.company_id });
    } catch {
      showToast("Chat settings were saved locally, but backend sync failed.", "info");
    }
  };

  const addMessage = async (message: ChatMessage, conversationUpdate?: Partial<ChatConversation>) => {
    setMessages((current) => [...current, message]);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === message.conversation_id
          ? {
              ...conversation,
              ...conversationUpdate,
              last_message: message.attachments?.length ? message.attachments[0].name : message.body,
              last_message_at: message.created_at,
              unread_by: conversation.participant_keys.filter((key) => key !== currentUserKey),
            }
          : conversation,
      ),
    );

    try {
      await api.post("/chat-messages", { ...message, company_id: user?.company_id });
    } catch {
      showToast("Message saved locally, but backend sync failed.", "info");
    }
  };

  const handleSelectConversation = async (conversation: ChatConversation) => {
    setActiveConversationId(conversation.id);
    setShowConversationMenu(false);
    setShowSidebar(false);
    if (conversation.unread_by?.includes(currentUserKey)) {
      await persistConversation({
        ...conversation,
        unread_by: conversation.unread_by.filter((key) => key !== currentUserKey),
      });
    }
  };

  const handleSend = async () => {
    if (!activeConversation) return;
    if (editingMessage ? !canEditMessages : !canSendInActiveConversation) return;
    if (!draft.trim() && !editingMessage) return;

    if (editingMessage) {
      const updated = {
        ...editingMessage,
        body: draft.trim(),
        edited_at: new Date().toISOString(),
      };
      setMessages((current) => current.map((message) => (message.id === editingMessage.id ? updated : message)));
      setEditingMessage(null);
      setDraft("");
      try {
        await api.put(`/chat-messages/${editingMessage.id}`, { ...updated, company_id: user?.company_id });
      } catch {
        showToast("Edit saved locally, but backend sync failed.", "info");
      }
      return;
    }

    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_key: currentUserKey,
      sender_name: currentUserName,
      body: draft.trim(),
      attachments: [],
      reply_to_id: replyingTo?.id || null,
      status_by: Object.fromEntries(activeConversation.participant_keys.map((key) => [key, key === currentUserKey ? "seen" : "delivered"])),
      reactions: [],
      created_at: now,
    };

    setDraft("");
    setReplyingTo(null);
    await addMessage(message);
  };

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!activeConversation || !files?.length) return;
    if (!canUploadInActiveConversation) {
      showToast("Only group admins can upload files in this group.", "error");
      return;
    }

    const uploads = await makeLocalUploadFiles(files, currentUserName);
    const attachments = uploads.map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
      type: file.type,
      size_label: file.size_label,
      mime_type: file.mime_type,
    }));
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_key: currentUserKey,
      sender_name: currentUserName,
      body: draft.trim() || attachments.map((attachment) => attachment.name).join(", "),
      attachments,
      reply_to_id: replyingTo?.id || null,
      status_by: Object.fromEntries(activeConversation.participant_keys.map((key) => [key, key === currentUserKey ? "seen" : "delivered"])),
      reactions: [],
      created_at: now,
    };

    setDraft("");
    setReplyingTo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await addMessage(message);
  };

  const handleDeleteMessage = (message: ChatMessage) => {
    const isOwnMessage = message.sender_key === currentUserKey;
    if ((!isOwnMessage || !canDeleteOwnMessages) && !canManageMessages) return;
    setConfirmationDialog({
      title: "Delete message?",
      description: "This message will be removed from the conversation. This action cannot be undone.",
      confirmLabel: "Delete Message",
      danger: true,
      onConfirm: async () => {
        const updated = { ...message, body: "This message was deleted.", attachments: [], deleted_at: new Date().toISOString() };
        setMessages((current) => current.map((item) => (item.id === message.id ? updated : item)));
        try {
          await api.put(`/chat-messages/${message.id}`, { ...updated, company_id: user?.company_id });
        } catch {
          showToast("Message deleted locally, but backend sync failed.", "info");
        }
      },
    });
  };

  const toggleReaction = async (message: ChatMessage, reactionKey: ChatReaction["key"]) => {
    if (!canCreateMessages) return;
    const reactions = message.reactions || [];
    const existing = reactions.find((reaction) => reaction.key === reactionKey);
    const nextReactions = existing
      ? reactions
          .map((reaction) =>
            reaction.key === reactionKey
              ? {
                  ...reaction,
                  user_keys: reaction.user_keys.includes(currentUserKey)
                    ? reaction.user_keys.filter((key) => key !== currentUserKey)
                    : [...reaction.user_keys, currentUserKey],
                }
              : reaction,
          )
          .map((reaction) => ({ ...reaction, count: reaction.user_keys.length }))
          .filter((reaction) => reaction.count > 0)
      : [...reactions, { key: reactionKey, count: 1, user_keys: [currentUserKey] }];

    const updated = { ...message, reactions: nextReactions };
    setMessages((current) => current.map((item) => (item.id === message.id ? updated : item)));
    try {
      await api.put(`/chat-messages/${message.id}`, { ...updated, company_id: user?.company_id });
    } catch {
      showToast("Reaction saved locally, but backend sync failed.", "info");
    }
  };

  const handleGroupAvatarUpload = async (files: FileList | null, target: "create" | "settings") => {
    const [upload] = await makeLocalUploadFiles(files, currentUserName);
    if (!upload) return;
    if (target === "create") {
      setNewGroupAvatar(upload.url);
      return;
    }
    if (activeConversation) {
      await persistConversation({ ...activeConversation, avatar: upload.url });
    }
  };

  const handleCreateGroup = async () => {
    if (!canCreateGroups) {
      showToast("You do not have permission to create chat groups.", "error");
      return;
    }
    if (!newGroupName.trim() || selectedMemberKeys.length === 0) {
      showToast("Add a group name and at least one member.", "error");
      return;
    }

    const currentMember = directory.find((member) => member.key === currentUserKey);
    const selectedMembers = directory.filter((member) => selectedMemberKeys.includes(member.key));
    const participants = [currentMember, ...selectedMembers].filter(Boolean) as ChatMember[];
    const conversation: ChatConversation = {
      id: `group-${Date.now()}`,
      type: "group",
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      avatar: newGroupAvatar,
      participant_keys: participants.map((member) => member.key),
      participants,
      admin_keys: [currentUserKey],
      created_by: currentUserKey,
      settings: {
        only_admins_can_send: false,
        only_admins_can_edit_info: true,
        allow_member_uploads: true,
        disappearing_messages_days: 0,
      },
      last_message: "Group created",
      last_message_at: new Date().toISOString(),
      unread_by: participants.map((member) => member.key).filter((key) => key !== currentUserKey),
      muted_by: [],
      archived_by: [],
      created_at: new Date().toISOString(),
    };

    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setShowCreateGroup(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupAvatar("");
    setSelectedMemberKeys([]);

    try {
      await api.post("/chat-conversations", { ...conversation, company_id: user?.company_id });
    } catch {
      showToast("Group created locally, but backend sync failed.", "info");
    }
  };

  const updateGroupSetting = async (patch: Partial<GroupSettings>) => {
    if (!activeConversation || activeConversation.type !== "group" || !canEditActiveGroupInfo) return;
    await persistConversation({
      ...activeConversation,
      settings: { ...(activeConversation.settings || {}), ...patch },
    });
  };

  const updateGroupInfo = async (name: string, description: string) => {
    if (!activeConversation || activeConversation.type !== "group" || !canEditActiveGroupInfo) return;
    await persistConversation({
      ...activeConversation,
      name: name.trim() || activeConversation.name,
      description: description.trim(),
    });
    showToast("Group information updated.", "success");
  };

  const addGroupMember = async (memberKey: string) => {
    if (!activeConversation || activeConversation.type !== "group" || !canManageActiveGroup) return;
    const member = directory.find((item) => item.key === memberKey);
    if (!member || activeConversation.participant_keys.includes(member.key)) return;
    const participantKeys = [...activeConversation.participant_keys, member.key];
    await persistConversation({
      ...activeConversation,
      participant_keys: participantKeys,
      participants: [...activeConversation.participants, member],
      unread_by: Array.from(new Set([...(activeConversation.unread_by || []), member.key])),
    });
    try {
      await api.post("/chat-messages", {
        id: `system-${Date.now()}`,
        conversation_id: activeConversation.id,
        sender_key: "system",
        sender_name: "System",
        body: `${currentUserName} added ${member.name} to the group.`,
        attachments: [],
        reactions: [],
        status_by: Object.fromEntries(participantKeys.map((key) => [key, key === currentUserKey ? "seen" : "delivered"])),
        created_at: new Date().toISOString(),
        company_id: user?.company_id,
      });
    } catch {
      showToast("Member added, but the notification could not be posted.", "info");
    }
  };

  const removeGroupMember = async (memberKey: string) => {
    if (!activeConversation || activeConversation.type !== "group" || !canManageActiveGroup) return;
    if (memberKey === currentUserKey) return;
    await persistConversation({
      ...activeConversation,
      participant_keys: activeConversation.participant_keys.filter((key) => key !== memberKey),
      participants: activeConversation.participants.filter((member) => member.key !== memberKey),
      admin_keys: (activeConversation.admin_keys || []).filter((key) => key !== memberKey),
    });
  };

  const toggleGroupAdmin = async (memberKey: string) => {
    if (!activeConversation || activeConversation.type !== "group" || !canManageActiveGroup) return;
    if (memberKey === activeConversation.created_by) return;
    const adminKeys = activeConversation.admin_keys || [];
    await persistConversation({
      ...activeConversation,
      admin_keys: adminKeys.includes(memberKey) ? adminKeys.filter((key) => key !== memberKey) : [...adminKeys, memberKey],
    });
  };

  const archiveActiveConversation = () => {
    if (!activeConversation) return;
    setConfirmationDialog({
      title: "Archive conversation?",
      description: `“${displayName || activeConversation.name}” will be hidden from your chat list.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        await persistConversation({
          ...activeConversation,
          archived_by: Array.from(new Set([...(activeConversation.archived_by || []), currentUserKey])),
        });
        setActiveConversationId(null);
        setShowGroupSettings(false);
      },
    });
  };

  const deleteActiveGroup = () => {
    if (!activeConversation || activeConversation.type !== "group" || !canDeleteActiveGroup) return;
    setConfirmationDialog({
      title: "Delete group?",
      description: `“${activeConversation.name}” and all of its messages will be permanently deleted.`,
      confirmLabel: "Delete Group",
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/chat-conversations/${activeConversation.id}`, {
            data: { actor_key: currentUserKey, actor_role: user?.role },
          });
          setConversations((current) => current.filter((conversation) => conversation.id !== activeConversation.id));
          setMessages((current) => current.filter((message) => message.conversation_id !== activeConversation.id));
          setActiveConversationId(null);
          setShowGroupSettings(false);
          showToast("Group deleted successfully.", "success");
        } catch {
          showToast("Failed to delete group.", "error");
        }
      },
    });
  };

  const leaveActiveGroup = () => {
    if (!activeConversation || activeConversation.type !== "group") return;
    if (!activeConversation.participant_keys.includes(currentUserKey)) return;
    if (activeConversation.created_by === currentUserKey) {
      showToast("Group creators cannot leave. Delete the group instead.", "error");
      return;
    }

    setConfirmationDialog({
      title: "Leave group?",
      description: `You will stop receiving messages from “${activeConversation.name}”.`,
      confirmLabel: "Leave Group",
      danger: true,
      onConfirm: async () => {
        const remainingParticipantKeys = activeConversation.participant_keys.filter((key) => key !== currentUserKey);
        await persistConversation({
          ...activeConversation,
          participant_keys: remainingParticipantKeys,
          participants: activeConversation.participants.filter((member) => member.key !== currentUserKey),
          admin_keys: (activeConversation.admin_keys || []).filter((key) => key !== currentUserKey),
          unread_by: (activeConversation.unread_by || []).filter((key) => key !== currentUserKey),
          muted_by: (activeConversation.muted_by || []).filter((key) => key !== currentUserKey),
          archived_by: (activeConversation.archived_by || []).filter((key) => key !== currentUserKey),
        });
        const createdAt = new Date().toISOString();
        try {
          await api.post("/chat-messages", {
            id: `system-${Date.now()}`,
            conversation_id: activeConversation.id,
            sender_key: "system",
            sender_name: "System",
            body: `${currentUserName} left the group.`,
            attachments: [],
            reactions: [],
            status_by: Object.fromEntries(remainingParticipantKeys.map((key) => [key, "delivered"])),
            created_at: createdAt,
            company_id: user?.company_id,
          });
        } catch {
          showToast("You left the group, but the notification could not be posted.", "info");
        }
        setActiveConversationId(null);
        setShowGroupSettings(false);
        showToast("You left the group.", "success");
      },
    });
  };

  const confirmPendingAction = async () => {
    if (!confirmationDialog) return;
    setConfirmationBusy(true);
    try {
      await confirmationDialog.onConfirm();
      setConfirmationDialog(null);
    } finally {
      setConfirmationBusy(false);
    }
  };

  const displayName = activeConversation
    ? activeConversation.type === "direct"
      ? getDirectConversationName(activeConversation, currentUserKey)
      : activeConversation.name
    : "";

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-140px)] flex bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden -mx-6 -mt-6">
        <aside className={`w-full md:w-[360px] border-r border-gray-200 flex-col bg-gray-50 ${showSidebar ? "flex" : "hidden md:flex"}`}>
          <div className="p-5 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Messages</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                  {canCreateGroups ? "Group creation enabled" : "Group creation requires permission"}
                </p>
              </div>
              {canCreateGroups ? (
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90"
                  title="Create group"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : (
                <div title="You do not have permission to create groups" className="h-10 w-10 rounded-xl bg-gray-100 text-gray-300 flex items-center justify-center">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["all", "unread", "groups"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && <div className="p-6 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading chats...</div>}
            {!loading && visibleConversations.length === 0 && (
              <div className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">No conversations found.</p>
              </div>
            )}
            {visibleConversations.map((conversation) => {
              const conversationName = conversation.type === "direct" ? getDirectConversationName(conversation, currentUserKey) : conversation.name;
              const avatar = conversation.type === "direct" ? getDirectAvatar(conversation, currentUserKey) : conversation.avatar;
              const unread = conversation.unread_by?.includes(currentUserKey);
              return (
                <button
                  key={String(conversation.id)}
                  type="button"
                  onClick={() => handleSelectConversation(conversation)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                    activeConversationId === conversation.id ? "bg-white shadow-sm ring-1 ring-gray-100" : "hover:bg-white/70"
                  }`}
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : conversation.type === "group" ? <Users className="h-5 w-5" /> : conversationName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-black text-gray-800">{conversationName}</p>
                      <span className="text-[9px] font-bold text-gray-400">{formatTime(conversation.last_message_at)}</span>
                    </div>
                    <p className={`mt-1 truncate text-xs ${unread ? "font-black text-gray-800" : "font-medium text-gray-400"}`}>
                      {conversation.last_message || "No messages yet"}
                    </p>
                  </div>
                  {unread && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </aside>

        <main className={`flex-1 flex-col bg-white ${!showSidebar ? "flex" : "hidden md:flex"}`}>
          {activeConversation ? (
            <>
              <header className="px-5 md:px-8 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4 min-w-0">
                  <button type="button" onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-primary">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                    {(activeConversation.type === "direct" ? getDirectAvatar(activeConversation, currentUserKey) : activeConversation.avatar) ? (
                      <img src={activeConversation.type === "direct" ? getDirectAvatar(activeConversation, currentUserKey) : activeConversation.avatar} alt="" className="h-full w-full object-cover" />
                    ) : activeConversation.type === "group" ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      displayName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-gray-800">{displayName}</h2>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {activeConversation.type === "group"
                        ? `${activeConversation.participants.length} members`
                        : activeConversation.participants.find((member) => member.key !== currentUserKey)?.role || "Direct chat"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setChatSearchQuery("")} className="hidden md:flex p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl">
                    <Search className="h-5 w-5" />
                  </button>
                  {activeConversation.type === "group" && (
                    <button type="button" onClick={() => setShowGroupSettings(true)} className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl">
                      <Info className="h-5 w-5" />
                    </button>
                  )}
                  <button type="button" onClick={archiveActiveConversation} className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl">
                    <Archive className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <button type="button" onClick={() => setShowConversationMenu((current) => !current)} className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-xl" aria-label="Conversation actions">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {showConversationMenu && (
                      <div className="absolute right-0 top-12 z-40 min-w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                        {canLeaveActiveGroup && (
                          <button type="button" onClick={() => { setShowConversationMenu(false); leaveActiveGroup(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50">
                            <UserMinus className="h-4 w-4" /> Leave Group
                          </button>
                        )}
                        {canDeleteActiveGroup && (
                          <button type="button" onClick={() => { setShowConversationMenu(false); deleteActiveGroup(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" /> Delete Group
                          </button>
                        )}
                        {!canLeaveActiveGroup && !canDeleteActiveGroup && (
                          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">No actions available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div className="px-5 md:px-8 py-3 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-300" />
                  <input
                    value={chatSearchQuery}
                    onChange={(event) => setChatSearchQuery(event.target.value)}
                    placeholder="Search inside this conversation..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-gray-700 outline-none focus:border-primary"
                  />
                </div>
              </div>

              {activePinnedMessage && (
                <button type="button" className="flex items-center gap-3 bg-primary/5 px-5 md:px-8 py-3 text-left border-b border-primary/10">
                  <Pin className="h-4 w-4 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Pinned Message</p>
                    <p className="truncate text-xs font-bold text-gray-700">{activePinnedMessage.body}</p>
                  </div>
                </button>
              )}

              <section className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 space-y-6">
                {activeMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">No messages yet</p>
                    <p className="mt-2 text-xs text-gray-400">Start the conversation from the composer below.</p>
                  </div>
                )}

                {activeMessages.map((message) => {
                  const isMe = message.sender_key === currentUserKey;
                  const deleted = Boolean(message.deleted_at);
                  return (
                    <div key={String(message.id)} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] md:max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        {activeConversation.type === "group" && !isMe && (
                          <span className="mb-1 ml-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{message.sender_name}</span>
                        )}
                        {message.reply_to_id && (
                          <div className={`mb-1 rounded-xl border-l-2 px-3 py-2 text-[10px] font-bold ${isMe ? "bg-primary/10 border-primary text-primary" : "bg-white border-gray-300 text-gray-500"}`}>
                            Replying to message
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm border ${isMe ? "rounded-tr-sm bg-primary text-white border-primary" : "rounded-tl-sm bg-white text-gray-800 border-gray-100"}`}>
                          {deleted ? (
                            <span className="italic opacity-70">This message was deleted.</span>
                          ) : (
                            <>
                              {message.body && <p>{message.body}</p>}
                              {Boolean(message.attachments?.length) && (
                                <div className="mt-3 grid gap-3">
                                  {message.attachments?.map((attachment) =>
                                    attachment.type === "image" ? (
                                      <button key={attachment.id} type="button" onClick={() => setImagePreview(attachment.url)} className="overflow-hidden rounded-xl border border-white/20 bg-black/5 text-left">
                                        <img src={attachment.url} alt={attachment.name} className="max-h-72 w-full object-cover" />
                                        <span className="block px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-80">{attachment.name}</span>
                                      </button>
                                    ) : (
                                      <a key={attachment.id} href={attachment.url} download className={`flex items-center gap-3 rounded-xl p-3 ${isMe ? "bg-white/10 text-white" : "bg-gray-50 text-gray-700"}`}>
                                        <FileText className="h-5 w-5" />
                                        <span className="min-w-0 flex-1 truncate text-xs font-black">{attachment.name}</span>
                                        <span className="text-[10px] opacity-70">{attachment.size_label}</span>
                                        <Download className="h-4 w-4" />
                                      </a>
                                    ),
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {!deleted && (
                          <div className={`mt-2 flex flex-wrap gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            {(message.reactions || []).map((reaction) => {
                              const ReactionIcon = reactionMeta[reaction.key].icon;
                              const active = reaction.user_keys.includes(currentUserKey);
                              return (
                                <button
                                  key={reaction.key}
                                  type="button"
                                  onClick={() => toggleReaction(message, reaction.key)}
                                  disabled={!canCreateMessages}
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${active ? "border-primary/20 bg-primary/10 text-primary" : "border-gray-100 bg-white text-gray-400"}`}
                                >
                                  <ReactionIcon className="h-3 w-3" />
                                  {reaction.count}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className={`mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 ${isMe ? "justify-end" : "justify-start"}`}>
                          {message.edited_at && <span>Edited</span>}
                          <span>{formatTime(message.created_at)}</span>
                          {isMe && !deleted && (getMessageStatus(message, currentUserKey) === "seen" ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3" />)}
                          {!deleted && (
                            <>
                              {canCreateMessages && (
                                <>
                                  <button type="button" onClick={() => setReplyingTo(message)} className="rounded p-1 hover:bg-white hover:text-primary" title="Reply">
                                    <Reply className="h-3 w-3" />
                                  </button>
                                  {(["like", "heart", "laugh"] as const).map((reactionKey) => {
                                    const ReactionIcon = reactionMeta[reactionKey].icon;
                                    return <button key={reactionKey} type="button" onClick={() => toggleReaction(message, reactionKey)} className="rounded p-1 hover:bg-white hover:text-primary" title={reactionMeta[reactionKey].label}><ReactionIcon className="h-3 w-3" /></button>;
                                  })}
                                </>
                              )}
                              {isMe && canEditMessages && (
                                <button type="button" onClick={() => { setEditingMessage(message); setDraft(message.body); }} className="rounded p-1 hover:bg-white hover:text-primary" title="Edit">
                                  <Edit className="h-3 w-3" />
                                </button>
                              )}
                              {((isMe && canDeleteOwnMessages) || canManageMessages) && (
                                <button type="button" onClick={() => handleDeleteMessage(message)} className="rounded p-1 hover:bg-white hover:text-red-500" title="Delete">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </section>

              {replyingTo && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 md:px-8 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Replying to {replyingTo.sender_key === currentUserKey ? "your message" : replyingTo.sender_name}</p>
                    <p className="truncate text-xs font-bold text-gray-500">{replyingTo.body}</p>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="p-2 text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <footer className="border-t border-gray-200 bg-white p-4 md:p-6">
                {!canSendInActiveConversation && (
                  <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700">
                    {!canCreateMessages
                      ? "View-only access. Ask an admin for messages.create permission to send messages."
                      : "Group settings currently allow only group admins to send messages."}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white p-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(event) => handleAttachmentUpload(event.target.files)}
                    className="hidden"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!canUploadInActiveConversation} className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 hover:text-primary disabled:opacity-40">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button type="button" className="hidden md:block rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 hover:text-primary">
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleSend()}
                    disabled={!canSendInActiveConversation}
                    placeholder={activeConversation.type === "group" ? "Message group..." : "Type a message..."}
                    className="min-w-0 flex-1 border-none bg-transparent px-2 py-2 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSendInActiveConversation || !draft.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 text-center">
              <MessageSquare className="h-14 w-14 text-gray-300 mb-5" />
              <h2 className="text-lg font-black text-gray-800">Select a conversation</h2>
              <p className="mt-2 text-xs font-medium text-gray-400">Choose a direct message or group from the left side.</p>
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create Group" size="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => groupAvatarInputRef.current?.click()} className="h-20 w-20 overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 hover:border-primary hover:text-primary">
              {newGroupAvatar ? <img src={newGroupAvatar} alt="" className="h-full w-full object-cover" /> : <Camera className="h-6 w-6" />}
            </button>
            <input ref={groupAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleGroupAvatarUpload(event.target.files, "create")} />
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Group Name</label>
              <input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="e.g. HR Operations" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
            <textarea value={newGroupDescription} onChange={(event) => setNewGroupDescription(event.target.value)} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Purpose of this group" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Members</label>
            <div className="grid max-h-72 grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-1">
              {directory.filter((member) => member.key !== currentUserKey).map((member) => {
                const selected = selectedMemberKeys.includes(member.key);
                return (
                  <button
                    key={member.key}
                    type="button"
                    onClick={() =>
                      setSelectedMemberKeys((current) => (selected ? current.filter((key) => key !== member.key) : [...current, member.key]))
                    }
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <MemberAvatar member={member} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-gray-800">{member.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{member.type} / {member.role}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-medium leading-relaxed text-blue-700">
            Admins and employees with message creation permission can create groups. Group admins can remove members and manage group settings.
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={() => setShowCreateGroup(false)} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-5 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="button" onClick={handleCreateGroup} className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Create Group</Button>
          </div>
        </div>
      </Modal>

      <GroupSettingsModal
        isOpen={showGroupSettings}
        conversation={activeConversation}
        directory={directory}
        currentUserKey={currentUserKey}
        canManage={canManageActiveGroup}
        canEditInfo={canEditActiveGroupInfo}
        canDelete={canDeleteActiveGroup}
        canLeave={canLeaveActiveGroup}
        settingsAvatarInputRef={settingsAvatarInputRef}
        onClose={() => setShowGroupSettings(false)}
        onAvatarUpload={(files) => handleGroupAvatarUpload(files, "settings")}
        onUpdateInfo={updateGroupInfo}
        onUpdateSetting={updateGroupSetting}
        onAddMember={addGroupMember}
        onRemoveMember={removeGroupMember}
        onToggleAdmin={toggleGroupAdmin}
        onDelete={deleteActiveGroup}
        onLeave={leaveActiveGroup}
      />

      <Modal isOpen={Boolean(confirmationDialog)} onClose={() => !confirmationBusy && setConfirmationDialog(null)} title={confirmationDialog?.title || "Confirm action"} size="sm">
        <div className="space-y-6">
          <p className="text-sm font-medium leading-relaxed text-gray-600">{confirmationDialog?.description}</p>
          <div className="flex justify-end gap-3">
            <Button type="button" disabled={confirmationBusy} onClick={() => setConfirmationDialog(null)} className="h-10 border border-gray-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-gray-600">Cancel</Button>
            <Button type="button" disabled={confirmationBusy} onClick={confirmPendingAction} className={`h-10 px-5 text-[10px] font-black uppercase tracking-widest text-white ${confirmationDialog?.danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}>
              {confirmationBusy ? "Please wait..." : confirmationDialog?.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>

      {imagePreview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={() => setImagePreview(null)}>
          <button type="button" className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          <img src={imagePreview} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </DashboardLayout>
  );
}

function MemberAvatar({ member }: { member: ChatMember }) {
  return (
    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase">
      {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> : member.name.charAt(0)}
    </div>
  );
}

function ToggleRow({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <div>
        <p className="text-xs font-black text-gray-800">{label}</p>
        <p className="mt-1 text-[10px] font-medium text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-primary" : "bg-gray-300"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function GroupSettingsModal({
  isOpen,
  conversation,
  directory,
  currentUserKey,
  canManage,
  canEditInfo,
  canDelete,
  canLeave,
  settingsAvatarInputRef,
  onClose,
  onAvatarUpload,
  onUpdateInfo,
  onUpdateSetting,
  onAddMember,
  onRemoveMember,
  onToggleAdmin,
  onDelete,
  onLeave,
}: {
  isOpen: boolean;
  conversation: ChatConversation | null;
  directory: ChatMember[];
  currentUserKey: string;
  canManage: boolean;
  canEditInfo: boolean;
  canDelete: boolean;
  canLeave: boolean;
  settingsAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onAvatarUpload: (files: FileList | null) => void;
  onUpdateInfo: (name: string, description: string) => void;
  onUpdateSetting: (patch: Partial<GroupSettings>) => void;
  onAddMember: (memberKey: string) => void;
  onRemoveMember: (memberKey: string) => void;
  onToggleAdmin: (memberKey: string) => void;
  onDelete: () => void;
  onLeave: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setName(conversation?.name || "");
      setDescription(conversation?.description || "");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [conversation?.description, conversation?.name]);

  if (!conversation || conversation.type !== "group") return null;

  const availableMembers = directory.filter((member) => !conversation.participant_keys.includes(member.key));
  const settings = conversation.settings || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group Settings" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 text-center">
            <button type="button" disabled={!canEditInfo} onClick={() => settingsAvatarInputRef.current?.click()} className="mx-auto h-28 w-28 overflow-hidden rounded-3xl bg-white text-gray-300 flex items-center justify-center shadow-sm disabled:cursor-not-allowed">
              {conversation.avatar ? <img src={conversation.avatar} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8" />}
            </button>
            <input ref={settingsAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => onAvatarUpload(event.target.files)} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Group Icon</p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Group Info</h3>
            <div className="space-y-3">
              <input value={name} disabled={!canEditInfo} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary disabled:bg-gray-50" />
              <textarea value={description} disabled={!canEditInfo} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary disabled:bg-gray-50" />
              <Button type="button" disabled={!canEditInfo} onClick={() => onUpdateInfo(name, description)} className="h-10 w-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                Save Info
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Safety</h3>
            <div className="space-y-3 text-xs font-medium text-gray-500">
              <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> End-to-end encryption placeholder for backend provider.</p>
              <p className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Admin-controlled member and media settings.</p>
            </div>
          </div>

          {canDelete && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-700">Delete Group</h3>
              <p className="mt-2 text-[10px] font-medium text-red-500">Permanently deletes this group and all of its messages.</p>
              <Button type="button" onClick={onDelete} className="mt-4 h-10 w-full bg-red-500 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Group
              </Button>
            </div>
          )}

          {canLeave && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-700">Leave Group</h3>
              <p className="mt-2 text-[10px] font-medium text-amber-600">You will no longer receive messages from this group.</p>
              <Button type="button" onClick={onLeave} className="mt-4 h-10 w-full bg-amber-500 text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-600">
                <UserMinus className="mr-2 h-4 w-4" /> Leave Group
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ToggleRow
              label="Only Admins Can Send"
              description="Locks the composer for normal members."
              checked={Boolean(settings.only_admins_can_send)}
              disabled={!canManage}
              onChange={(value) => onUpdateSetting({ only_admins_can_send: value })}
            />
            <ToggleRow
              label="Only Admins Edit Info"
              description="Prevents members from editing name, icon, and description."
              checked={settings.only_admins_can_edit_info !== false}
              disabled={!canManage}
              onChange={(value) => onUpdateSetting({ only_admins_can_edit_info: value })}
            />
            <ToggleRow
              label="Member Uploads"
              description="Allow members to share images and files."
              checked={settings.allow_member_uploads !== false}
              disabled={!canManage}
              onChange={(value) => onUpdateSetting({ allow_member_uploads: value })}
            />
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs font-black text-gray-800">Disappearing Messages</p>
              <select disabled={!canManage} value={settings.disappearing_messages_days || 0} onChange={(event) => onUpdateSetting({ disappearing_messages_days: Number(event.target.value) })} className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold disabled:bg-gray-50">
                <option value={0}>Off</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Participants</h3>
                <p className="mt-1 text-[10px] font-bold text-gray-400">{conversation.participants.length} members</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              {conversation.participants.map((member) => {
                const isGroupAdmin = Boolean(conversation.admin_keys?.includes(member.key));
                const isCreator = member.key === conversation.created_by;
                return (
                  <div key={member.key} className="flex items-center gap-3 rounded-2xl bg-gray-50/70 p-3">
                    <MemberAvatar member={member} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-gray-800">{member.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {member.type} {isGroupAdmin ? "/ Group Admin" : ""} {isCreator ? "/ Creator" : ""}
                      </p>
                    </div>
                    {canManage && member.key !== currentUserKey && (
                      <div className="flex gap-1">
                        <button type="button" disabled={isCreator} onClick={() => onToggleAdmin(member.key)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30" title={isGroupAdmin ? "Remove admin" : "Make admin"}>
                          <Shield className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={isCreator} onClick={() => onRemoveMember(member.key)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" title="Remove member">
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {canManage && (
            <div className="rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Add Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableMembers.map((member) => (
                  <button key={member.key} type="button" onClick={() => onAddMember(member.key)} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:border-primary/30">
                    <MemberAvatar member={member} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-gray-800">{member.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{member.type}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-primary" />
                  </button>
                ))}
                {availableMembers.length === 0 && <p className="text-xs font-bold text-gray-400">All available users are already in this group.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
