import type { InboxProvider } from "./InboxProvider";
import { mergedInboxProvider } from "./MergedInboxProvider";

export const inboxProvider: InboxProvider = mergedInboxProvider;
