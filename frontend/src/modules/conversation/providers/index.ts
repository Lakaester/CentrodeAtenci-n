import type { ConversationProvider } from "./ConversationProvider";
import { mergedConversationProvider } from "./MergedConversationProvider";

export const conversationProvider: ConversationProvider = mergedConversationProvider;
